import hashlib

def hash_username(username: str) -> str:
    # Convert username to lowercase and encode to bytes
    data = username.lower().encode('utf-8')
    
    # Compute SHA-256 hash
    hash_object = hashlib.sha256(data)
    
    # Convert to hexadecimal string
    return hash_object.hexdigest()

# Test usernames
usernames = ['xiaoshu', 'tiantianquan', 'poaers', 'shu_test']

print("Generated hashes:")
print("=" * 50)
for username in usernames:
    hash_value = hash_username(username)
    print(f"'{username}' -> '{hash_value}'")

print("\n" + "=" * 50)
print("Copy these hashes to your app.js file:")
print("=" * 50)
print("this.authorizedUserHashes = [")
for username in usernames:
    hash_value = hash_username(username)
    print(f"    '{hash_value}', // {username}")
print("];") 