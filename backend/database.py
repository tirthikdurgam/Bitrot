import os
from supabase import create_client, Client
from dotenv import load_dotenv

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

# --- USER FUNCTIONS ---

def update_score(username, points, kill=False):
    """Updates score based on Username (from Auth), not IP"""
    if not supabase: return
    try:
        # Check if user exists in public table
        res = supabase.table("users").select("entropy_score, kills").eq("username", username).execute()
        if not res.data: return
        
        current = res.data[0]
        new_score = current['entropy_score'] + points
        new_kills = current['kills'] + (1 if kill else 0)
        
        supabase.table("users").update({"entropy_score": new_score, "kills": new_kills}).eq("username", username).execute()
    except Exception as e:
        print(f"Error updating score: {e}")

def get_top_destroyers():
    if not supabase: return []
    try:
        res = supabase.table("users").select("username, entropy_score, kills").order("entropy_score", desc=True).limit(10).execute()
        return res.data
    except:
        return []

def get_user_loot(username):
    if not supabase: return []
    try:
        res = supabase.table("images").select("*").eq("username", username).execute()
        return res.data
    except:
        return []

# --- POST/IMAGE FUNCTIONS ---

def create_post(username, image_filename, caption="", secret_text=None):
    """
    Creates a post in the 'images' table.
    If 'secret_text' is provided, it also logs it in the 'image_secrets' vault.
    """
    if not supabase: return None
    try:
        # 1. Prepare Public Data
        data = {
            "username": username,
            "image_filename": image_filename, 
            "bit_integrity": 100.0,
            "current_quality": 100.0,
            "generations": 0,
            "witnesses": 0,
            "is_archived": False,
            "storage_path": image_filename,
            "caption": caption,
            "has_secret": True if secret_text else False
        }
        
        # 2. Insert Image & Get ID
        res = supabase.table("images").insert(data).execute()
        if not res.data: return None
        
        new_image_id = res.data[0]['id']

        # 3. Insert Secret (If exists)
        if secret_text:
            print(f"Locking secret for Image {new_image_id}...")
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
    Attempts to retrieve a secret. 
    RLS policies automatically handle the 80% integrity check.
    """
    if not supabase: return None
    try:
        res = supabase.table("image_secrets").select("secret_text").eq("image_id", post_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]['secret_text']
        return None # RLS blocked it or no secret exists
    except Exception as e:
        print(f"Error fetching secret: {e}")
        return None

def get_live_posts():
    if not supabase: return []
    try:
        res = supabase.table("images").select("*").eq("is_archived", False).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Error getting feed: {e}")
        return []

# --- COMMENT FUNCTIONS ---

def get_comments(post_id):
    """Fetch all comments for a specific post."""
    if not supabase: return []
    try:
        response = supabase.table("comments").select("*").eq("post_id", post_id).order("created_at", desc=False).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"DATABASE ERROR (get_comments): {e}")
        return []

def add_comment(post_id, username, content, integrity, parent_id=None):
    """Add a new comment or reply."""
    if not supabase: return None
    try:
        data = {
            "post_id": post_id,
            "username": username,
            "content": content,
            "integrity_snapshot": integrity,
            "parent_id": parent_id
        }
        response = supabase.table("comments").insert(data).execute()
        print(f"Comment saved! (Parent: {parent_id})")
        return response.data
    except Exception as e:
        print(f"DATABASE INSERT ERROR: {e}")
        return None