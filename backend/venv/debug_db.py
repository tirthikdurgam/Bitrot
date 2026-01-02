import os
from supabase import create_client
from dotenv import load_dotenv
import time

load_dotenv()

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to {url}...")
supabase = create_client(url, key)

# Test Data matching your main.py payload
test_payload = {
    "username": "Debug_User",
    "storage_path": "debug_test.png",
    "image_filename": "debug_test.png",
    "bit_integrity": 100.0,
    "current_quality": 100.0,
    "caption": "Debug Test",
    "has_secret": False
}

print("Attempting to insert test row into 'images'...")

try:
    data = supabase.table("images").insert(test_payload).execute()
    print("✅ SUCCESS! Database is accepting uploads.")
    print(data)
except Exception as e:
    print("\n❌ CRITICAL FAILURE. HERE IS THE EXACT ERROR:")
    print("------------------------------------------------")
    print(e)
    print("------------------------------------------------")
    print("HINT: If it says 'null value in column X violates not-null constraint', you need to add column X to your insert payload or make it nullable in Supabase.")