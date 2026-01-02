import os
from dotenv import load_dotenv
from supabase import create_client, Client
import bitrot  # Importing your custom library

# 1. Load Environment Variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 2. Initialize Supabase Client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: Could not connect to Supabase in decay.py: {e}")

# --- FUNCTION 1: The Wrapper (Uses your BitRot Library) ---
def inflict_bitloss(input_path, output_path, health):
    """
    Decays a local image using the custom 'bitrot' library.
    """
    try:
        # Convert health (0-100) to integrity (0.0 - 1.0)
        # We clamp it to 0.01 to prevent the library from crashing or doing nothing
        integrity_val = max(0.01, min(1.0, float(health) / 100.0))
        
        # Use the library to handle the actual image processing
        bitrot.decay_file(input_path, output_path, integrity=integrity_val)
        
        print(f"   -> Decayed Local File: Health {health}% -> Integrity {integrity_val:.2f}")
        return True

    except Exception as e:
        print(f"   -> Error in decay script: {e}")
        return False

# --- FUNCTION 2: The Garbage Collector ---
def cleanup_dead_artifact(active_path):
    """
    Deletes the corrupted file from Supabase 'active' folder 
    once it hits 0% integrity to save storage space.
    """
    if not supabase:
        print("   -> Error: Supabase client not initialized. Cannot delete file.")
        return False

    try:
        print(f"   -> 🗑️ Deleting dead artifact from storage: {active_path}")
        
        # Call Supabase Storage API to remove the file
        response = supabase.storage.from_("bitloss-images").remove([active_path])
        
        # Check if response indicates success
        if response:
            print("   -> Successfully deleted from cloud.")
            return True
        else:
            print("   -> Warning: File might not exist or deletion failed.")
            return False
            
    except Exception as e:
        print(f"   -> Error deleting dead file: {e}")
        return False