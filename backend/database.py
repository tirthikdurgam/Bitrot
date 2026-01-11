import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# 1. Load env vars
load_dotenv()
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
# Prefer service key, fallback to anon
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

key = service_key if service_key else anon_key

supabase: Client = None

if not url or not key:
    print("WARNING: Supabase credentials missing in backend/.env")
else:
    try:
        supabase = create_client(url, key)
        print(f"Database Connected (Admin Mode: {bool(service_key)})")
    except Exception as e:
        print(f"Database Connection Error: {e}")

# --- CREDIT & SCORE FUNCTIONS ---

def update_credits(user_id, amount):
    """
    Modifies user credits using UUID (user_id).
    """
    if not supabase: return None
    try:
        # 1. Get current credits using ID (safer than username)
        res = supabase.table("users").select("credits").eq("id", user_id).execute()
        if not res.data: return None
        
        current_credits = res.data[0].get('credits', 0)
        new_balance = current_credits + amount
        
        if new_balance < 0:
            return None # Insufficient funds
            
        # 2. Update
        supabase.table("users").update({"credits": new_balance}).eq("id", user_id).execute()
        return new_balance
    except Exception as e:
        print(f"Error updating credits: {e}")
        return None

def get_credits(user_id):
    if not supabase: return 0
    try:
        res = supabase.table("users").select("credits").eq("id", user_id).execute()
        if res.data:
            return res.data[0].get('credits', 0)
        return 0
    except:
        return 0

def update_score(user_id, points, kill=False):
    """Updates entropy_score and kills based on UUID."""
    if not supabase: return
    try:
        res = supabase.table("users").select("entropy_score, kills").eq("id", user_id).execute()
        if not res.data: return
        
        current = res.data[0]
        new_score = (current.get('entropy_score') or 0) + points
        new_kills = (current.get('kills') or 0) + (1 if kill else 0)
        
        supabase.table("users").update({"entropy_score": new_score, "kills": new_kills}).eq("id", user_id).execute()
    except Exception as e:
        print(f"Error updating score: {e}")

# --- POST/IMAGE FUNCTIONS ---

def create_post(user_id, username, image_path, caption="", secret_text=None):
    """
    Creates a post matching the current schema (uploader_id, storage_path, etc.)
    """
    if not supabase: return None
    try:
        # Based on your video, we map the fields exactly:
        data = {
            "uploader_id": user_id,        # The Foreign Key to users.id
            "username": username,          # Snapshot of the username
            "storage_path": image_path,    # The Active file (will rot)
            "original_storage_path": image_path, # The Archive file (stays safe)
            "bit_integrity": 100.0,
            "current_quality": 100.0,
            "generations": 0,
            "witnesses": 0,
            "is_archived": False,
            "is_destroyed": False,
            "caption": caption,
            "has_secret": True if secret_text else False,
            "last_viewed": datetime.utcnow().isoformat()
        }
        
        res = supabase.table("images").insert(data).execute()
        if not res.data: return None
        
        new_image_id = res.data[0]['id']

        # Insert Secret (RLS Protected)
        if secret_text:
            secret_payload = {
                "image_id": new_image_id,
                "secret_text": secret_text
            }
            supabase.table("image_secrets").insert(secret_payload).execute()
            
        return res.data[0]
        
    except Exception as e:
        print(f"Error creating post: {e}")
        return None

def get_secret(post_id):
    """
    Retrieves secret text. (RLS policies on Supabase handle the security check)
    """
    if not supabase: return None
    try:
        # Changed to select "secret_text" specifically
        res = supabase.table("image_secrets").select("secret_text").eq("image_id", post_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]['secret_text']
        return None 
    except Exception as e:
        print(f"Error fetching secret: {e}")
        return None

# --- COMMENT FUNCTIONS ---

def get_comments(post_id):
    if not supabase: return []
    try:
        # Fetch comments
        response = supabase.table("comments").select("*").eq("post_id", post_id).order("created_at", desc=False).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"DATABASE ERROR (get_comments): {e}")
        return []

def add_comment(post_id, user_id, content, integrity, parent_id=None):
    """
    Add a new comment. Uses user_id (UUID) for foreign key linkage.
    """
    if not supabase: return None
    try:
        data = {
            "post_id": post_id,
            "user_id": user_id,  # Important: Use UUID, not username
            "content": content,
            "bit_integrity": integrity,
            "parent_id": parent_id
        }
        response = supabase.table("comments").insert(data).execute()
        print(f"Comment saved! (Parent: {parent_id})")
        return response.data
    except Exception as e:
        print(f"DATABASE INSERT ERROR: {e}")
        return None