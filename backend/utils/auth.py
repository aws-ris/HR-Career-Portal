import hmac
import hashlib
import base64
import json
import time
import os

# JWT Secret Key - falls back to a strong default if not set in environmental configs
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ris-hiring-portal-secret-key-12345!")

def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using PBKDF2 SHA-256 and a 16-byte random salt.
    Format: pbkdf2_sha256$iterations$salt$hash
    """
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"pbkdf2_sha256$100000${salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verifies a plain-text password against a stored PBKDF2 SHA-256 hash or fallback plaintext.
    """
    if not stored_hash:
        return False
        
    if not stored_hash.startswith("pbkdf2_sha256$"):
        # Fallback comparison for legacy plaintext hashes
        return hmac.compare_digest(password, stored_hash)

    try:
        parts = stored_hash.split("$")
        if len(parts) != 4:
            return False
        _, iterations, salt, expected_key = parts
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), int(iterations))
        return hmac.compare_digest(key.hex(), expected_key)
    except Exception as e:
        print(f"[Auth Error] Password hash verification failed: {e}")
        return False

def generate_token(username: str) -> str:
    """
    Generates a secure cryptographically signed session token.
    Token format: base64(payload).hex_hmac_signature
    Session expires automatically in 12 hours.
    """
    payload = {
        "username": username,
        "exp": int(time.time()) + 12 * 3600  # 12 hours session validity
    }
    payload_json = json.dumps(payload)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip("=")
    
    # Generate signature based on SECRET_KEY and base64 payload
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_token(token: str) -> str:
    """
    Verifies token authenticity and signature.
    Returns the username if valid and active, otherwise returns None.
    """
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
            
        payload_b64, signature = parts
        
        # Verify signature matching
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            return None
            
        # Add base64 padding if stripped
        missing_padding = len(payload_b64) % 4
        if missing_padding:
            payload_b64 += '=' * (4 - missing_padding)
            
        # Decode and load payload
        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode())
        payload = json.loads(payload_bytes.decode())
        
        # Check token expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload.get("username")
    except Exception as e:
        print(f"[Auth Error] Token verification failure: {e}")
        return None
