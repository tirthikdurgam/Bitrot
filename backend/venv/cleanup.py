import asyncio
import database as db

# --- CONFIG ---
BUCKET_NAME = "bitloss-images"

async def archive_dead_images():
    """
    The Reaper:
    1. Checks for destroyed images (is_destroyed=True) not yet archived.
    2. Deletes associated comments and secrets (Cleanup).
    3. Deletes the corrupted 'active' file (Storage Optimization).
    4. Updates DB to point to the 'original' backup and marks as archived (Restoration).
    """
    # 1. SAFETY CHECK
    if not db.supabase: 
        print("REAPER: Database offline. Skipping scan.")
        return

    try:
        # 2. Find images that are dead but NOT yet archived
        response = db.supabase.table("images")\
            .select("*")\
            .eq("is_destroyed", True)\
            .eq("is_archived", False)\
            .execute()
        
        dead_images = response.data

        if not dead_images: 
            return

        print(f"REAPER: Found {len(dead_images)} dead artifacts. Processing...")

        for img in dead_images:
            post_id = img['id']
            active_path = img.get('storage_path')

            # --- STEP A: DELETE COMMENTS ---
            try:
                db.supabase.table("comments").delete().eq("post_id", post_id).execute()
                print(f"[{post_id}] Comments silenced.")
            except Exception:
                pass

            # --- STEP B: DELETE SECRETS ---
            try:
                db.supabase.table("image_secrets").delete().eq("image_id", post_id).execute()
                print(f"[{post_id}] Secrets deleted.")
            except Exception:
                pass 

            # --- STEP C: SWAP FILE & ARCHIVE ---
            if active_path and "active/" in active_path:
                try:
                    # 1. Remove active file from storage (Delete the rot)
                    db.supabase.storage.from_(BUCKET_NAME).remove([active_path])
                    
                    # 2. Calculate original path (Restore the memory)
                    original_path = active_path.replace("active/", "originals/")
                    
                    # 3. Update DB
                    db.supabase.table("images").update({
                        "storage_path": original_path,
                        "is_archived": True,
                        "witnesses": 0
                    }).eq("id", post_id).execute()
                    
                    print(f"[{post_id}] Archived and restored memory.")
                except Exception as e:
                    print(f"[{post_id}] Failed to archive: {e}")
            else:
                # Fallback for weird paths
                db.supabase.table("images").update({"is_archived": True}).eq("id", post_id).execute()

    except Exception as e:
        print(f"REAPER CRITICAL ERROR: {e}")