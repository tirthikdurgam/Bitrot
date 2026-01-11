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

# --- HELPER FUNCTIONS ---
# NOTE: The core logic for the feed and decay is now handled directly in main.py 
# to allow for efficient batch processing. These helpers are updated for compatibility 
# with the new schema but are primarily for utility usage.

def update_credits(user_id, amount):
    """
    Modifies user credits using the UUID (user_id).
    """
    if not supabase: return None
    try:
        # 1. Get current credits
        res = supabase.table("users").select("credits").eq("id", user_id).execute()
        if not res.data: return None
        
        current_credits = res.data[0].get('credits', 0)
        new_balance = current_credits + amount
        
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

# --- POST/IMAGE FUNCTIONS ---

def create_post(user_id, username, image_path, caption="", secret_text=None):
    """
    Creates a post using the new schema (uploader_id, storage_path, etc.)
    """
    if not supabase: return None
    try:
        data = {
            "uploader_id": user_id,        # Linked to Auth UUID
            "username": username,          # Display name snapshot
            "storage_path": image_path,    # The file path in bucket
            "original_storage_path": image_path,
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
    Attempts to retrieve a secret via image_id.
    """
    if not supabase: return None
    try:
        # Fixed: Select secret_text where image_id matches
        res = supabase.table("image_secrets").select("secret_text").eq("image_id", post_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]['secret_text']
        return None 
    except Exception as e:
        print(f"Error fetching secret: {e}")
        return None

# --- COMMENT FUNCTIONS ---

def add_comment(post_id, user_id, content, integrity, parent_id=None):
    """Add a new comment linked to the UUID."""
    if not supabase: return None
    try:
        data = {
            "post_id": post_id,
            "user_id": user_id,  # Use UUID, not username
            "content": content,
            "bit_integrity": integrity, # Matches main.py usage
            "parent_id": parent_id
        }
        response = supabase.table("comments").insert(data).execute()
        return response.data
    except Exception as e:
        print(f"DATABASE INSERT ERROR: {e}")
        return None