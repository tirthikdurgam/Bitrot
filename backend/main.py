import asyncio
from contextlib import asynccontextmanager
import os
from pathlib import Path
import random
import time
from datetime import datetime
from pydantic import BaseModel
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

# --- 1. ROBUST ENV LOADING ---
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")

print(f"DEBUG: Loaded SUPABASE_URL: {SUPABASE_URL}")

# --- SAFETY WRAPPER (The Fix) ---
def safe_db_execute(query):
    """
    Executes a Supabase query with retries to handle random disconnections.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return query.execute()
        except (httpx.RemoteProtocolError, httpx.ReadTimeout, httpx.ConnectTimeout):
            if attempt < max_retries - 1:
                print(f"DB Connection unstable. Retrying ({attempt+1}/{max_retries})...")
                time.sleep(0.2)
            else:
                print("DB Connection failed after retries.")
                raise 
        except Exception as e:
            raise e

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

os.makedirs("static/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="static/images"), name="images")

# --- DATA MODELS ---
class InteractRequest(BaseModel):
    post_id: str
    action: str # "heal" or "corrupt"

# --- HELPER: BACKGROUND DECAY TASK ---
def process_remote_decay(storage_path: str, current_health: float):
    if not storage_path or not db.supabase:
        return
    try:
        bucket_name = "bitloss-images"
        file_data = db.supabase.storage.from_(bucket_name).download(storage_path)
        
        integrity_ratio = max(0.01, current_health / 100.0)
        rotted_data = bitrot.decay_bytes(file_data, integrity=integrity_ratio)
        
        db.supabase.storage.from_(bucket_name).upload(
            storage_path,
            rotted_data,
            file_options={"x-upsert": "true", "content-type": "image/jpeg"}
        )
    except Exception as e:
        print(f"SKIPPING DECAY for {storage_path}: {e}")

# --- HELPER: STRICT USER AUTH ---
def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ")[1]
        user_response = db.supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            return None
        user_id = user_response.user.id
        profile_res = db.supabase.table("users").select("*").eq("id", user_id).execute()
        if profile_res.data and len(profile_res.data) > 0:
            return profile_res.data[0]
        else:
            return None
    except Exception as e:
        print(f"AUTH ERROR: {str(e)}")
        return None

# --- ROUTES ---

@app.get("/me")
def get_my_identity(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not Authenticated")
    return user

@app.post("/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...), 
    caption: str = Form(None),
    secret: str = Form(None)
):
    if not db.supabase:
        raise HTTPException(status_code=503, detail="Database not connected")

    user = get_current_user(request)
    if not user:
         raise HTTPException(status_code=401, detail="Must be logged in to upload")

    author_username = user['username']
    author_id = user['id']

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
            "uploader_id": author_id, 
            "username": author_username,
            "storage_path": active_path, 
            "original_storage_path": original_path,
            "bit_integrity": 100.0,
            "current_quality": 100.0,
            "caption": caption if caption else "",
            "has_secret": True if secret else False,
            "is_destroyed": False,
            "is_archived": False,
            "generations": 0,
            "witnesses": 0,
            "last_viewed": datetime.utcnow().isoformat()
        }
        
        print(f"Creating image record for user: {author_username}...")
        # Use safe_db_execute for critical inserts
        safe_db_execute(db.supabase.table("images").insert(image_payload))
        
        # We need the ID, so we query it back or assume success if no error raised
        # To be safe, we'll re-fetch the latest for this user
        new_post_res = db.supabase.table("images").select("id").eq("storage_path", active_path).execute()
        new_image_id = new_post_res.data[0]['id']

        if secret:
            secret_payload = {
                "image_id": new_image_id, 
                "secret_text": secret
            }
            safe_db_execute(db.supabase.table("image_secrets").insert(secret_payload))

        return {"status": "success", "id": new_image_id}

    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feed")
async def get_feed(request: Request, background_tasks: BackgroundTasks):
    if not db.supabase: return []

    try:
        current_user = get_current_user(request)
        current_user_id = current_user['id'] if current_user else None
        
        # Use safe_db_execute for fetching
        response = safe_db_execute(
            db.supabase.table('images')
            .select('*')
            .eq('is_archived', False)
            .order('created_at', desc=True)
        )
        posts = response.data
        
        final_response_data = []
        db_updates = []
        total_viewer_credits = 0
        kills_this_session = 0 
        
        current_time = time.time()

        for row in posts:
            author_id = row.get('uploader_id')
            p_author_name = row.get('username', 'Unknown')
            p_author_av = None
            
            if author_id:
                try:
                    # Using maybe_single to prevent crash if user deleted
                    author_res = db.supabase.table('users').select('username, avatar_url').eq('id', author_id).maybe_single().execute()
                    if author_res.data:
                        p_author_name = author_res.data['username']
                        p_author_av = author_res.data['avatar_url']
                except: pass

            try:
                last_update_str = row.get('last_viewed')
                last_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00')).timestamp() if last_update_str else current_time
            except:
                last_update = current_time

            time_diff = current_time - last_update
            decay_rate = (0.05 / 3600.0) * (1 + (row.get('witnesses', 0) / 50)) * (1 + (row.get('generations', 0) / 20))
            decay_amount = decay_rate * time_diff

            old_integrity = row.get('bit_integrity', 100.0)
            new_integrity = old_integrity
            is_destroyed_now = row.get('is_destroyed', False)
            
            if not is_destroyed_now:
                new_integrity = max(0.0, old_integrity - decay_amount)
                
                if current_user_id:
                    credit_diff = int(old_integrity) - int(new_integrity)
                    if credit_diff > 0:
                        total_viewer_credits += credit_diff

                if new_integrity <= 0 and old_integrity > 0:
                    is_destroyed_now = True 
                    if author_id:
                        try:
                            a_data = db.supabase.table('users').select('credits').eq('id', author_id).single().execute()
                            current_a_creds = a_data.data.get('credits', 0) if a_data.data else 0
                            db.supabase.table('users').update({'credits': current_a_creds + 100}).eq('id', author_id).execute()
                        except: pass

                    if current_user_id:
                        if author_id and current_user_id != author_id:
                            total_viewer_credits += 100 
                            kills_this_session += 1 

                row.update({
                    "bit_integrity": new_integrity,
                    "current_quality": new_integrity, 
                    "last_viewed": datetime.utcnow().isoformat(),
                    "witnesses": (row.get('witnesses', 0) or 0) + 1,
                    "is_destroyed": is_destroyed_now,
                    "is_archived": is_destroyed_now
                })
                
                db_updates.append({
                    "id": row['id'],
                    "bit_integrity": new_integrity,
                    "current_quality": new_integrity,
                    "last_viewed": row['last_viewed'],
                    "witnesses": row['witnesses'],
                    "is_destroyed": row['is_destroyed'],
                    "is_archived": row['is_archived']
                })

                if new_integrity < 100 and row.get("storage_path"):
                     background_tasks.add_task(process_remote_decay, row["storage_path"], new_integrity)

            # Comments
            c_res = safe_db_execute(
                db.supabase.table('comments').select('*').eq('post_id', row['id']).order('created_at')
            )
            final_comments = []
            for c in c_res.data:
                u_res = db.supabase.table('users').select('username, avatar_url').eq('id', c['user_id']).maybe_single().execute()
                final_comments.append({
                    "id": str(c['id']),
                    "username": u_res.data['username'] if u_res.data else 'Anon',
                    "avatar_url": u_res.data['avatar_url'] if u_res.data else None,
                    "content": c['content'],
                    "created_at": c['created_at']
                })

            has_secret = False
            try:
                s_chk = db.supabase.table('image_secrets').select('image_id').eq('image_id', row['id']).maybe_single().execute()
                if s_chk.data: has_secret = True
            except: pass

            s_path = row.get('storage_path')
            img_url = f"{SUPABASE_URL}/storage/v1/object/public/bitloss-images/{s_path}" if s_path else ""

            final_response_data.append({
                "id": row['id'],
                "username": p_author_name,
                "avatar_url": p_author_av,
                "image": img_url,
                "bitIntegrity": row.get('bit_integrity', 100.0),
                "generations": row.get('generations', 0),
                "witnesses": row.get('witnesses', 0),
                "caption": row.get("caption", ""),
                "has_secret": has_secret,
                "comments": final_comments
            })

        if db_updates:
            safe_db_execute(db.supabase.table('images').upsert(db_updates))

        if current_user_id and (total_viewer_credits > 0 or kills_this_session > 0):
            u_data = db.supabase.table('users').select('credits, kills').eq('id', current_user_id).single().execute()
            if u_data.data:
                exist_creds = u_data.data.get('credits', 0) or 0
                exist_kills = u_data.data.get('kills', 0) or 0
                
                # Safe update for user profile
                safe_db_execute(db.supabase.table('users').update({
                    'credits': exist_creds + total_viewer_credits,
                    'kills': exist_kills + kills_this_session
                }).eq('id', current_user_id))

        return final_response_data

    except Exception as e:
        print(f"Feed System Error: {e}")
        return []

@app.post("/interact")
def interact_with_post(request: Request, body: InteractRequest):
    try:
        user = get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Login required")

        user_id = user['id']
        COST = 10

        if not db.supabase:
            raise HTTPException(status_code=503, detail="DB Disconnected")

        # 1. Credits Check
        u_data = safe_db_execute(db.supabase.table('users').select('credits').eq('id', user_id).single())
        current_creds = u_data.data.get('credits', 0)
        
        if current_creds < COST:
             raise HTTPException(status_code=402, detail="Insufficient Credits")
        
        # 2. Deduct (Safe Update)
        safe_db_execute(db.supabase.table('users').update({'credits': current_creds - COST}).eq('id', user_id))

        # 3. Fetch Image
        post_res = safe_db_execute(db.supabase.table("images").select("*").eq("id", body.post_id))
        if not post_res.data:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post = post_res.data[0]
        current_integrity = post.get("bit_integrity", 100.0)

        if body.action == "heal":
            new_integrity = min(100.0, current_integrity + 5.0)
        elif body.action == "corrupt":
            new_integrity = max(0.0, current_integrity - 5.0)
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        # 4. Update Image (Safe Update)
        safe_db_execute(db.supabase.table("images").update({
            "bit_integrity": new_integrity,
            "current_quality": new_integrity,
            "last_viewed": datetime.utcnow().isoformat()
        }).eq("id", body.post_id))

        return {
            "status": "success",
            "new_integrity": new_integrity,
            "remaining_credits": current_creds - COST,
            "action": body.action
        }
    except HTTPException as he:
        raise he 
    except Exception as e:
        print(f"Interact Error: {e}")
        raise HTTPException(status_code=500, detail="Interaction failed due to server error")

@app.get("/graveyard")
def get_graveyard():
    if not db.supabase: return [] 
    
    response = safe_db_execute(
        db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True).limit(4)
    )
    res = response.data
    
    results = []
    for post in res:
        final_path = post.get("original_storage_path") or post.get("storage_path")
        base_url = SUPABASE_URL
        results.append({
            "id": post["id"],
            "username": post.get("username", "Unknown"),
            "storage_path": final_path,
            "image": f"{base_url}/storage/v1/object/public/bitloss-images/{final_path}"
        })
    return results

@app.get("/archive")
def get_archive():
    if not db.supabase: return []
    response = safe_db_execute(
        db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True)
    )
    res = response.data
    results = []
    for post in res:
        final_path = post.get("original_storage_path") or post.get("storage_path")
        base_url = SUPABASE_URL
        results.append({
            "id": post["id"],
            "username": post.get("username", "Unknown"),
            "generations": post.get("generations", 0),
            "storage_path": final_path,
            "image": f"{base_url}/storage/v1/object/public/bitloss-images/{final_path}"
        })
    return results

@app.get("/trending")
def get_trending():
    if not db.supabase: return []
    response = safe_db_execute(
        db.supabase.table("images").select("*").eq("is_archived", False).order("generations", desc=True).limit(5)
    )
    res = response.data
    results = []
    for post in res:
        results.append({
            "id": post["id"],
            "username": post.get("username", "Unknown"),
            "generations": post.get("generations", 0),
            "bitIntegrity": post.get("current_quality", 100),
            "decay_rate": f"{min(99, int((post.get('generations') or 0) * 0.1))}%/view"
        })
    return results

@app.post("/comment")
async def post_comment(request: Request, body: dict):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    try:
        post_data = safe_db_execute(db.supabase.table("images").select("current_quality").eq("id", body['post_id']))
        current_integrity = 100.0
        if post_data.data:
            current_integrity = post_data.data[0].get('current_quality', 100.0)
        
        parent_id = body.get('parent_id')
        
        # Link comment to user_id (UUID)
        comment_payload = {
            "post_id": body['post_id'],
            "user_id": user['id'],
            "content": body['content'],
            "bit_integrity": current_integrity, 
            "parent_id": parent_id
        }
        
        # Safe Insert
        safe_db_execute(db.supabase.table("comments").insert(comment_payload))
        
        return {"status": "Comment recorded"}
    except Exception as e:
        print(f"Comment Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save comment")

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