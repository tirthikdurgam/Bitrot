import os
import random
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import bitrot

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: Could not connect to Supabase: {e}")

def calculate_decay(image_row, killer_name="Anonymous"):
    """
    Calculates integrity. If 0%, marks as destroyed.
    Cleanup is handled asynchronously by the reaper service.
    """
    current_val = image_row.get('bit_integrity')
    if current_val is None:
        current_val = image_row.get('current_quality', 100.0)
        
    current_integrity = float(current_val)
    
    # Decay rate: 0.05% to 0.1% per view
    decay_amount = random.uniform(0.05, 0.1) 
    new_integrity = max(0.0, current_integrity - decay_amount)

    updates = {
        "bit_integrity": new_integrity,
        "current_quality": new_integrity, 
        "generations": (image_row.get('generations') or 0) + 1,
        "last_viewed": datetime.utcnow().isoformat()
    }

    if new_integrity <= 0 and current_integrity > 0:
        print(f"IMAGE DESTROYED by {killer_name}")
        updates["killed_by"] = killer_name
        updates["is_destroyed"] = True 

    return updates

def inflict_bitloss(input_path, output_path, health):
    try:
        integrity_val = max(0.01, min(1.0, float(health) / 100.0))
        bitrot.decay_file(input_path, output_path, integrity=integrity_val)
        print(f"Visual Decay Applied: {health:.2f}%")
        return True
    except Exception as e:
        print(f"Visual Decay Failed: {e}")
        return False

def process_remote_decay(storage_path, integrity):
    if not supabase: return

    try:
        if "active/" not in storage_path:
            return

        print(f"Processing Remote Decay: {storage_path} @ {integrity:.2f}%")
        
        filename = storage_path.split("/")[-1]
        local_input = f"temp_in_{filename}"
        local_output = f"temp_out_{filename}"

        with open(local_input, "wb") as f:
            res = supabase.storage.from_("bitloss-images").download(storage_path)
            f.write(res)

        inflict_bitloss(local_input, local_output, integrity)

        with open(local_output, "rb") as f:
            supabase.storage.from_("bitloss-images").upload(
                storage_path,
                f,
                file_options={"upsert": "true", "content-type": "image/png"}
            )
        
        if os.path.exists(local_input): os.remove(local_input)
        if os.path.exists(local_output): os.remove(local_output)
        
        print("Remote Decay Complete")

    except Exception as e:
        print(f"Remote Decay Failed: {e}")
        if os.path.exists(local_input): os.remove(local_input)
        if os.path.exists(local_output): os.remove(local_output)