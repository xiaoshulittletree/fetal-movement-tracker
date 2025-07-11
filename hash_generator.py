import hashlib

def hash_username(username: str) -> str:
    # Convert username to lowercase and encode to bytes
    data = username.lower().encode('utf-8')
    
    # Compute SHA-256 hash
    hash_object = hashlib.sha256(data)
    
    # Convert to hexadecimal string
    return hash_object.hexdigest()

print(hash_username("xiaoshu"))  # Outputs: a SHA-256 hash string
