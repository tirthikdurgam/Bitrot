import random
import hashlib
import os

# --- CONFIGURATION ---
SALT = "bitloss_secure_salt_v1_change_me_if_deployed"

PREFIXES = ["Void", "Null", "Data", "Cyber", "Net", "Bit", "Ghost", "Neon", "Sector", "Glitch"]
SUFFIXES = ["Walker", "Runner", "Ghost", "Surfer", "Phantom", "Entity", "Drifter", "Node", "Zero"]

def get_anonymous_id(ip_address: str) -> str:
    """
    Turns a raw IP address (e.g., '192.168.1.5') into a secure, anonymous hash.
    """
    if not ip_address:
        return "unknown_ghost"
        
    raw_string = f"{ip_address}{SALT}"
    return hashlib.sha256(raw_string.encode()).hexdigest()

def generate_username():
    """Generates a random cyberpunk username like 'Void_Walker_99'"""
    # We keep this strictly random because we only generate it once on user creation
    return f"{random.choice(PREFIXES)}_{random.choice(SUFFIXES)}_{random.randint(10, 99)}"

def decay_text(text: str, health: float) -> str:
    """
    Corrupts text visually based on integrity level.
    
    THE FIX: This uses a 'seed' based on the text + health.
    This ensures the glitch pattern stays EXACTLY the same 
    until the health drops again. No more flickering/slot-machine effect.
    """
    if not text: 
        return ""
    
    # If health is perfect, return text as is
    if health >= 100: 
        return text
    
    seed_key = f"{text}_{int(health * 10)}"
    
    rng = random.Random(seed_key)
    
    length = len(text)
    corruption_ratio = (100 - health) / 100.0
    num_chars_to_break = int(length * corruption_ratio)
    
    if num_chars_to_break == 0 and health < 95:
        num_chars_to_break = 1

    # 4. The Glitch Characters (Cyberpunk style)
    glitch_chars = ["#", "$", "%", "&", "!", "?", "0", "1", "@", "§", "µ", "ø", "X", "†", "█", "░", "▒", "▓"]
    
    # 5. Apply the Corruption
    chars = list(text)
    
    # Pick stable random indices based on our seed
    indices_to_corrupt = rng.sample(range(length), min(num_chars_to_break, length))
    
    for i in indices_to_corrupt:
        # Don't corrupt spaces, keep word structure visible
        if chars[i] != " ":
            chars[i] = rng.choice(glitch_chars)
        
    return "".join(chars)