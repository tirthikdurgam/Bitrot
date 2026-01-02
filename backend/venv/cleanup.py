import asyncio
import database as db
from decay import cleanup_dead_artifact

# --- CONFIG ---
BUCKET_NAME = "bitloss-images"

async def archive_dead_images():
    """
    Checks for images with 0 integrity.
    1. Deletes all associated COMMENTS (Cleanup).
    2. Deletes any remaining SECRETS (Security).
    3. Deletes their Active file from Supabase 'active/' folder (Save Storage).
    4. Marks them as 'is_archived' in DB (Frontend then serves the Original).
    """
    # 1. SAFETY CHECK: Stop immediately if DB is offline
    if not db.supabase: 
        print("REAPER: Database offline. Skipping scan.")
        return

    try:
        # 2. Find images that are dead (<= 0%) but NOT yet archived
        response = db.supabase.table("images")\
            .select("*")\
            .lte("current_quality", 0)\
            .eq("is_archived", False)\
            .execute()
        
        dead_images = response.data

        if not dead_images: 
            return

        print(f"REAPER: Found {len(dead_images)} dead artifacts. Processing...")

        for img in dead_images:
            post_id = img['id']
            storage_path = img.get('storage_path')

            # --- STEP A: DELETE COMMENTS (Privacy/Cleanup) ---
            # We wipe all discussion traces for this post
            try:
                # Direct delete where post_id matches
                db.supabase.table("comments").delete().eq("post_id", post_id).execute()
                print(f"   -> [{post_id}] Comments silenced.")
            except Exception as e:
                print(f"   -> [{post_id}] Failed to delete comments: {e}")

            # --- STEP B: DELETE SECRETS (Security) ---
            # Ensure no secret text remains for this dead file
            try:
                db.supabase.table("image_secrets").delete().eq("image_id", post_id).execute()
            except Exception as e:
                # It might have been deleted by the feed loop already, which is fine
                pass 

            # --- STEP C: DELETE ACTIVE FILE (Storage Optimization) ---
            # We permanently remove the corrupted .jpg from the 'active' folder.
            # The 'original' folder remains safe for the Archive view.
            if storage_path and "active/" in storage_path:
                # cleanup_dead_artifact handles the Supabase storage removal
                cleanup_dead_artifact(storage_path)

            # --- STEP D: MARK ARCHIVED ---
            # This moves it from Feed -> Archive/Graveyard
            # We set witnesses to 0 to stop any further processing logic.
            db.supabase.table("images").update({
                "is_archived": True,
                "current_quality": 0,
                "witnesses": 0
            }).eq("id", post_id).execute()

            print(f"   -> [{post_id}] Archived successfully.")

    except Exception as e:
        print(f"REAPER CRITICAL ERROR: {e}")