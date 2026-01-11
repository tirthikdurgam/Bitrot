import asyncio
from contextlib import asynccontextmanager
import os
from pathlib import Path
import random
import shutil
import time
import uuid
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
from decay import calculate_decay
import utils

# --- 1. ROBUST ENV LOADING ---
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

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

os.makedirs("static/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="static/images"), name="images")

class InteractRequest(BaseModel):
    post_id: str
    action: str # "heal" or "corrupt"

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

        # MAPPED TO YOUR EXISTING COLUMNS: uploader_id, last_viewed_timestamp
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
            "status": "active",
            "generations": 0,
            "witnesses": 0,
            "last_viewed_timestamp": datetime.utcnow().isoformat()
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
async def get_feed(request: Request, background_tasks: BackgroundTasks):
    """
    Main feed logic: Calculates decay, awards credits to viewers/authors, 
    records destroyed artifacts, and returns formatted post data.
    """
    if not db.supabase: return []

    try:
        # 1. Identify the current viewer for credit rewards
        current_user = get_current_user(request)
        current_user_id = current_user['id'] if current_user else None
        
        # 2. Fetch all image records from the database
        response = db.supabase.table('images').select('*').order('created_at', desc=True).execute()
        posts = response.data
        
        updated_posts = []
        total_viewer_credits = 0
        artifacts_to_record = []
        
        current_time = time.time()

        for row in posts:
            # --- AUTHOR DATA (Mapped to uploader_id) ---
            author_id = row.get('uploader_id')
            p_author_name = row.get('username', 'Unknown')
            p_author_av = None
            
            if author_id:
                # Fetch author profile for the feed card
                author_res = db.supabase.table('users').select('username, avatar_url').eq('id', author_id).single().execute()
                if author_res.data:
                    p_author_name = author_res.data['username']
                    p_author_av = author_res.data['avatar_url']

            # --- DECAY CALCULATION ---
            try:
                # Use last_viewed_timestamp to calculate how long since the last decay
                last_update_str = row.get('last_viewed_timestamp')
                if last_update_str:
                    last_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00')).timestamp()
                else:
                    last_update = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')).timestamp()
            except:
                last_update = current_time

            time_diff = current_time - last_update
            
            # Algorithmic decay rate based on witnesses and generation depth
            decay_rate = 0.05 * (1 + (row.get('witnesses', 0) / 50)) * (1 + (row.get('generations', 0) / 20))
            decay_amount = decay_rate * time_diff

            # --- UPDATE & REWARD LOGIC ---
            earned_credits = 0
            kill_bonus = False

            if row.get('status') == 'active':
                old_integrity = row.get('bit_integrity', 100.0)
                new_integrity = max(0.0, old_integrity - decay_amount)
                
                # Passive Viewer Reward: 1 Credit per 1% decay witnessed
                if current_user_id:
                    credit_diff = int(old_integrity) - int(new_integrity)
                    if credit_diff > 0:
                        earned_credits += credit_diff

                # --- DEATH EVENT (Integrity reaches 0) ---
                if new_integrity <= 0 and old_integrity > 0:
                    # A. REWARD ORIGINAL AUTHOR (+100 Credits)
                    if author_id:
                        try:
                            a_data = db.supabase.table('users').select('credits').eq('id', author_id).single().execute()
                            if a_data.data:
                                new_a_bal = (a_data.data['credits'] or 0) + 100
                                db.supabase.table('users').update({'credits': new_a_bal}).eq('id', author_id).execute()
                                print(f"DEATH EVENT: Author {author_id} rewarded 100 credits.")
                        except Exception as e:
                            print(f"Author Reward Failure: {e}")

                    # B. REWARD KILLER (+100 Credits if viewer is not the author)
                    if current_user_id:
                        if author_id and current_user_id != author_id:
                            earned_credits += 100 
                            print(f"DEATH EVENT: Viewer {current_user_id} earned Kill Bonus.")
                        
                        kill_bonus = True # Mark for artifact record regardless of bonus eligibility

                # Data to update in the database
                image_update_data = {
                    "id": row['id'],
                    "bit_integrity": new_integrity,
                    "current_quality": new_integrity, 
                    "last_viewed_timestamp": datetime.utcnow().isoformat(),
                    "witnesses": (row.get('witnesses') or 0) + 1,
                    "status": "decayed" if new_integrity <= 0 else "active",
                    "is_archived": True if new_integrity <= 0 else False,
                    "is_destroyed": True if new_integrity <= 0 else False
                }
                
                # Trigger physical file bitrot in the background
                if new_integrity < 100 and row.get("storage_path"):
                     background_tasks.add_task(process_remote_decay, row["storage_path"], new_integrity)

                # Queue artifact record to link destroyed image to the viewer
                if kill_bonus and current_user_id:
                    artifacts_to_record.append({
                        "user_id": current_user_id,
                        "image_id": row['id'],
                        "activity_type": "destroyed",
                        "timestamp": datetime.utcnow().isoformat()
                    })

                row.update(image_update_data)
            
            # --- FETCH COMMENTS FOR THIS POST ---
            c_res = db.supabase.table('comments').select('*').eq('post_id', row['id']).order('created_at').execute()
            final_comments = []
            for c in c_res.data:
                # Get avatar/username for each commenter
                u_res = db.supabase.table('users').select('username, avatar_url').eq('id', c['user_id']).single().execute()
                final_comments.append({
                    "id": str(c['id']),
                    "username": u_res.data['username'] if u_res.data else 'Anon',
                    "avatar_url": u_res.data['avatar_url'] if u_res.data else None,
                    "content": c['content'],
                    "created_at": c['created_at']
                })

            # Construct final URL for the image
            s_path = row.get('storage_path')
            img_url = f"{SUPABASE_URL}/storage/v1/object/public/bitloss-images/{s_path}" if s_path else ""

            # Add to the formatted response list
            updated_posts.append({
                "id": row['id'],
                "username": p_author_name,
                "avatar_url": p_author_av,
                "image": img_url,
                "bitIntegrity": row.get('bit_integrity', 100.0),
                "generations": row.get('generations', 0),
                "witnesses": row.get('witnesses', 0),
                "caption": row.get("caption", ""),
                "has_secret": row.get("has_secret", False),
                "comments": final_comments
            })
            
            total_viewer_credits += earned_credits

        # --- BATCH DATABASE UPDATES ---
        if updated_posts:
            # Sync integrity and witness counts back to Supabase
            upsert_data = [{
                "id": p['id'],
                "bit_integrity": p.get('bit_integrity', 100.0),
                "current_quality": p.get('bit_integrity', 100.0),
                "last_viewed_timestamp": datetime.utcnow().isoformat(),
                "witnesses": p.get('witnesses', 0),
                "status": "decayed" if p.get('bit_integrity', 100.0) <= 0 else "active",
                "is_archived": True if p.get('bit_integrity', 100.0) <= 0 else False
            } for p in updated_posts]
            
            if upsert_data:
                db.supabase.table('images').upsert(upsert_data).execute()

        # Finalize credits for the viewer
        if current_user_id and total_viewer_credits > 0:
            u_data = db.supabase.table('users').select('credits').eq('id', current_user_id).single().execute()
            new_bal = (u_data.data.get('credits', 0) or 0) + total_viewer_credits
            db.supabase.table('users').update({'credits': new_bal}).eq('id', current_user_id).execute()

        # Insert artifact records for images destroyed during this session
        if artifacts_to_record:
            try:
                db.supabase.table('user_artifacts').insert(artifacts_to_record).execute()
            except Exception as e:
                print(f"Artifact Logging Error: {e}")

        return updated_posts

    except Exception as e:
        print(f"Feed System Error: {e}")
        return []

@app.post("/interact")
def interact_with_post(request: Request, body: InteractRequest):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    user_id = user['id']
    COST = 10

    if not db.supabase:
        raise HTTPException(status_code=503, detail="DB Disconnected")

    u_data = db.supabase.table('users').select('credits').eq('id', user_id).single().execute()
    current_creds = u_data.data['credits'] or 0
    
    if current_creds < COST:
         raise HTTPException(status_code=402, detail="Insufficient Credits")
    
    new_balance = current_creds - COST
    db.supabase.table('users').update({'credits': new_balance}).eq('id', user_id).execute()

    post_res = db.supabase.table("images").select("*").eq("id", body.post_id).execute()
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

    db.supabase.table("images").update({
        "bit_integrity": new_integrity,
        "current_quality": new_integrity,
        "last_viewed_timestamp": datetime.utcnow().isoformat() # Mapped
    }).eq("id", body.post_id).execute()

    return {
        "status": "success",
        "new_integrity": new_integrity,
        "remaining_credits": new_balance,
        "action": body.action
    }

@app.get("/graveyard")
def get_graveyard():
    if not db.supabase: return [] 
    
    query = db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True).limit(4)
    res = safe_db_execute(query).data
    
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
    
    query = db.supabase.table("images").select("*").eq("is_archived", True).order("created_at", desc=True)
    res = safe_db_execute(query).data
    
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
    
    query = db.supabase.table("images").select("*").eq("is_archived", False).order("generations", desc=True).limit(5)
    res = safe_db_execute(query).data
    
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
    
    if db.supabase:
        post_data = db.supabase.table("images").select("current_quality").eq("id", body['post_id']).execute()
        current_integrity = 100.0
        if post_data.data:
            current_integrity = post_data.data[0].get('current_quality', 100.0)
        
        parent_id = body.get('parent_id')
        
        comment_payload = {
            "post_id": body['post_id'],
            "user_id": user['id'],
            "content": body['content'],
            "bit_integrity": current_integrity,
            "parent_id": parent_id
        }
        db.supabase.table("comments").insert(comment_payload).execute()
        
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