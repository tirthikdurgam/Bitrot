import hashlib

# --- CONFIGURATION ---
SALT = "bitloss_secure_salt_v1_change_me_if_deployed"

def get_anonymous_id(ip_address: str) -> str:
    """
    Turns a raw IP address into a secure hash. 
    (Kept for potential rate-limiting usage, though unused for Auth now)
    """
    if not ip_address:
        return "unknown_ghost"
        
    raw_string = f"{ip_address}{SALT}"
    return hashlib.sha256(raw_string.encode()).hexdigest()

def decay_text(text: str, health: float) -> str:
    """
    Text decay is DISABLED. 
    Returns the original text regardless of health.
    """
    return text