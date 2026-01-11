import asyncio
from contextlib import asynccontextmanager
import os
from pathlib import Path
import random
import shutil
import time
import uuid

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

# Custom/Third-Party Libraries
import bitrot
from ghosttag import GhostTag

# Local Application Imports
from cleanup import archive_dead_images
import database as db
from decay import calculate_decay, inflict_bitloss, process_remote_decay
import utils

# --- 1. ROBUST ENV LOADING ---
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# CHECK: Attempt to load standard URL, fallback to NEXT_PUBLIC if missing
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")

print(f"DEBUG: Loaded SUPABASE_URL: {SUPABASE_URL}")

def safe_db_execute(query):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return query.execute()
        except (httpx.RemoteProtocolError, httpx.ReadTimeout):
            if attempt < max_retries - 1:
                time.sleep(0.2)
            else:
                raise 
        except Exception as e:
            raise e

ghost = GhostTag(redundancy=20, seed=1337)

# --- LIFECYCLE: THE REAPER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("SYSTEM: Initializing Reaper Protocol...")
    
    async def reaper_loop():
        while True:
            await archive_dead_images()
            await asyncio.sleep(60)

    reaper_task = asyncio.create_task(reaper_loop())
    
    yield 
    
    print("SYSTEM: Shutting down Reaper...")
    reaper_task.cancel()
    try:
        await reaper_task
    except asyncio.CancelledError:
        pass

# --- APP INITIALIZATION ---
app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://bitrotdev.vercel.app",
    "https://bitloss.vercel.app",
    "https://bitrot.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOCAL STORAGE ---
os.makedirs("static/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="static/images"), name="images")

# --- HELPER: BACKGROUND DECAY TASK ---
def process_remote_decay(storage_path: str, current_health: float):
    if not storage_path or not db.supabase:
        return

    try:
        bucket_name = "bitloss-images"
        print(f"Processing {storage_path} in memory...")
        
        file_data = db.supabase.storage.from_(bucket_name).download(storage_path)
        
        integrity_ratio = max(0.01, current_health / 100.0)
        rotted_data = bitrot.decay_bytes(file_data, integrity=integrity_ratio)
        
        db.supabase.storage.from_(bucket_name).upload(
            storage_path,
            rotted_data,
            file_options={"x-upsert": "true", "content-type": "image/jpeg"}
        )
        print(f"SUCCESS: Rotted {storage_path}")

    except Exception as e:
        print(f"SKIPPING DECAY for {storage_path}: {e}")

# --- HELPER: STRICT USER AUTH ---
def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization')
    
    # 1. Check if Header Exists
    if not auth_header or not auth_header.startswith("Bearer "):
        print("AUTH ERROR: Missing or Invalid Authorization Header")
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        token = auth_header.split(" ")[1]
        
        # 2. Verify with Supabase
        user_response = db.supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise Exception("Invalid Token")

        user_id = user_response.user.id
        
        # 3. Fetch Profile from Public Table
        profile_res = db.supabase.table("users").select("*").eq("id", user_id).execute()
        
        if profile_res.data and len(profile_res.data) > 0:
            return profile_res.data[0]
        else:
            print(f"AUTH ERROR: User {user_id} has no public profile.")
            raise HTTPException(status_code=404, detail="User profile not found")
                
    except Exception as e:
        print(f"AUTH ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# --- ROUTES ---

@app.get("/me")
def get_my_identity(request: Request):
    return get_current_user(request)

@app.post("/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...), 
    caption: str = Form(None),
    secret: str = Form(None)
):
    if not db.supabase:
        raise HTTPException(status_code=503, detail="Database not connected")

    # 1. Enforce Auth
    user = get_current_user(request)
    author_username = user['username']

    try:
        file_bytes = await file.read()
        
        original_ext = file.filename.split('.')[-1]
        file_ext = "png" if secret else original_ext 
        
        unique_id = f"{int(time.time())}_{random.randint(100, 999)}"
        filename = f"{unique_id}.{file_ext}"

        active_path = f"active/{filename}"      
        original_path = f"originals/{filename}" 

        print(f"Uploading Active Copy: {active_path}...")
        db.supabase.storage.from_("bitloss-images").upload(
            active_path,
            file_bytes,
            file_options={"content-type": f"image/{file_ext}"}
        )

        print(f"Uploading Original Copy: {original_path}...")
        db.supabase.storage.from_("bitloss-images").upload(
            original_path,
            file_bytes,
            file_options={"content-type": f"image/{file_ext}"}
        )

        image_payload = {
            "username": author_username,
            "storage_path": active_path, 
            "bit_integrity": 100.0,
            "current_quality": 100.0,
            "caption": caption if caption else "",
            "has_secret": True if secret else False,
            "is_destroyed": False,
            "is_archived": False
        }
        
        print(f"Creating image record for user: {author_username}...")
        response = db.supabase.table("images").insert(image_payload).execute()
        
        if not response.data:
            raise Exception("Failed to insert image record")
            
        new_image_id = response.data[0]['id']

        if secret:
            print(f"Encrypting secret for image {new_image_id}...")
            secret_payload = {
                "image_id": new_image_id, 
                "secret_text": secret
            }
            db.supabase.table("image_secrets").insert(secret_payload).execute()

        return {"status": "success", "id": new_image_id}

    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feed")
def get_feed(request: Request, background_tasks: BackgroundTasks):
    if not db.supabase: return []
    
    posts = db.get_live_posts() 
    results = []

    for post in posts:
        # Determine viewer for decay calculation (passive viewing)
        viewer_name = "Anonymous"
        try:
            auth_header = request.headers.get('Authorization')
            if auth_header:
                user = get_current_user(request)
                viewer_name = user['username']
        except:
            pass

        updates = calculate_decay(post, killer_name=viewer_name)
        
        new_integrity = updates["bit_integrity"]
        new_generations = updates["generations"]
        
        try:
            updates["witnesses"] = (post.get("witnesses") or 0) + 1
            update_query = db.supabase.table("images").update(updates).eq("id", post["id"])
            safe_db_execute(update_query)
        except Exception as e:
            print(f"DB UPDATE ERROR: {e}")

        if new_integrity < 80.0:
            try:
                if post.get("has_secret"):
                    purge_query = db.supabase.table("image_secrets").delete().eq("image_id", post["id"])
                    safe_db_execute(purge_query)
            except Exception as e:
                pass 

        if post.get("storage_path") and new_integrity < 100 and "active/" in post.get("storage_path", ""):
            background_tasks.add_task(
                process_remote_decay, 
                post["storage_path"], 
                new_integrity
            )

        processed_comments = []
        try:
            # 1. Fetch raw comments
            comment_query = db.supabase.table("comments")\
                .select("*")\
                .eq("post_id", post['id'])\
                .order("created_at", desc=False)
            
            response = safe_db_execute(comment_query)
            raw_data = response.data if response.data else []
            
            # 2. Extract unique usernames from comments
            comment_usernames = list(set(c.get('username') for c in raw_data if c.get('username')))
            
            # 3. Fetch avatars for these users efficiently (Batch Query)
            avatar_map = {}
            if comment_usernames:
                user_res = db.supabase.table("users").select("username, avatar_url").in_("username", comment_usernames).execute()
                if user_res.data:
                    for u in user_res.data:
                        avatar_map[u['username']] = u.get('avatar_url')

            # 4. Build response with avatars attached
            for c in raw_data:
                uname = c.get('username', 'Anonymous')
                processed_comments.append({
                    "id": str(c.get('id')),
                    "username": uname,
                    "avatar_url": avatar_map.get(uname), # <--- AVATAR URL NOW INCLUDED
                    "content": c.get('content', '[REDACTED]'),
                    "created_at": c.get('created_at'),
                    "parent_id": str(c.get('parent_id')) if c.get('parent_id') else None
                })
        except Exception as e:
            print(f"COMMENT FETCH ERROR for post {post['id']}: {e}")
            processed_comments = [] 

        storage_path = post.get("storage_path")
        base_url = SUPABASE_URL if SUPABASE_URL else "https://YOUR_PROJECT.supabase.co"
        image_url = f"{base_url}/storage/v1/object/public/bitloss-images/{storage_path}"

        results.append({
            "id": post["id"],
            "username": post['username'],
            "storage_path": storage_path,
            "image": image_url, 
            "bitIntegrity": new_integrity, 
            "generations": new_generations,
            "witnesses": updates["witnesses"],
            "caption": post.get("caption", ""),
            "has_secret": post.get("has_secret", False),
            "comments": processed_comments 
        })
        
    return results

@app.get("/graveyard")
def get_graveyard():
    if not db.supabase: return [] 
    
    query = db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True).limit(4)
    res = safe_db_execute(query).data
    
    results = []
    for post in res:
        final_path = post.get("original_storage_path") or post.get("storage_path")
        base_url = SUPABASE_URL if SUPABASE_URL else "https://PROJECT_ID.supabase.co"
        
        results.append({
            "id": post["id"],
            "username": post["username"],
            "storage_path": final_path,
            "image": f"{base_url}/storage/v1/object/public/bitloss-images/{final_path}"
        })
    return results

@app.get("/archive")
def get_archive():
    if not db.supabase: return []
    
    query = db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True)
    res = safe_db_execute(query).data
    
    results = []
    for post in res:
        final_path = post.get("original_storage_path") or post.get("storage_path")
        base_url = SUPABASE_URL if SUPABASE_URL else "https://PROJECT_ID.supabase.co"

        results.append({
            "id": post["id"],
            "username": post["username"],
            "generations": post["generations"],
            "storage_path": final_path,
            "image": f"{base_url}/storage/v1/object/public/bitloss-images/{final_path}"
        })
    return results

@app.get("/trending")
def get_trending():
    if not db.supabase: return []
    
    query = db.supabase.table("images").select("*").eq("is_archived", False).order("generations", desc=True).limit(5)
    res = safe_db_execute(query).data
    
    results = []
    for post in res:
        results.append({
            "id": post["id"],
            "username": post["username"],
            "generations": post["generations"],
            "bitIntegrity": post.get("current_quality", 100),
            "decay_rate": f"{min(99, int((post.get('generations') or 0) * 0.1))}%/view"
        })
    return results

@app.post("/comment")
async def post_comment(request: Request, body: dict):
    # STRICT AUTH: Will throw 401 if user is not logged in
    user = get_current_user(request)
    
    if db.supabase:
        post_data = db.supabase.table("images").select("current_quality").eq("id", body['post_id']).execute()
        current_integrity = 100.0
        if post_data.data:
            current_integrity = post_data.data[0].get('current_quality', 100.0)
        
        parent_id = body.get('parent_id')
        
        # Now guaranteed to be the REAL username
        db.add_comment(body['post_id'], user['username'], body['content'], current_integrity, parent_id)
        
    return {"status": "Comment recorded"}

@app.get("/reveal/{post_id}")
def reveal_secret(post_id: str):
    if not db.supabase: 
        return {"status": "error", "message": "DB_DISCONNECTED"}
    
    try:
        query = db.supabase.table("images").select("current_quality").eq("id", post_id)
        image_data = safe_db_execute(query)
        
        if not image_data.data:
            return {"status": "error", "message": "IMAGE_ID_NOT_FOUND"}

        current_integrity = image_data.data[0].get('current_quality', 100.0)

        if current_integrity < 80.0:
            return {"status": "dead", "message": f"INTEGRITY_TOO_LOW ({int(current_integrity)}%)"}

        secret_query = db.supabase.table("image_secrets").select("secret_text").eq("image_id", post_id)
        response = safe_db_execute(secret_query)

        if response.data and len(response.data) > 0:
            return {"status": "success", "message": response.data[0]['secret_text']}
        else:
            return {"status": "dead", "message": "SECRET_NOT_FOUND_IN_DB"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}