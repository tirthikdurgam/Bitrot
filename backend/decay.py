import bitrot
import database as db

def process_remote_decay(storage_path: str, current_health: float):
    """
    Background Task: Downloads the image, applies bitrot in memory,
    and re-uploads it to Supabase.
    """
    # Safety checks
    if not storage_path or not db.supabase:
        return

    # Filter: Only decay files in the 'active/' folder
    if "active/" not in storage_path:
        return

    try:
        bucket_name = "bitloss-images"
        
        # 1. Download File (Bytes)
        # print(f"Processing {storage_path}...")
        file_data = db.supabase.storage.from_(bucket_name).download(storage_path)
        
        # 2. Apply Bitrot (In-Memory)
        # Map 0-100 scale to 0.0-1.0 scale
        integrity_ratio = max(0.01, current_health / 100.0)
        rotted_data = bitrot.decay_bytes(file_data, integrity=integrity_ratio)
        
        # 3. Upload Result (Overwrite)
        db.supabase.storage.from_(bucket_name).upload(
            storage_path,
            rotted_data,
            file_options={"x-upsert": "true", "content-type": "image/jpeg"}
        )
        # print(f"SUCCESS: Rotted {storage_path}")

    except Exception as e:
        print(f"DECAY ERROR for {storage_path}: {e}")