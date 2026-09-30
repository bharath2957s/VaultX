"""
VaultX Cryptographic Module
Argon2id, AES-256-GCM, SHA-256, HMAC-SHA256
"""

import os
import secrets
import hashlib
import hmac
import base64
from typing import Tuple, Dict, Any
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

MASTER_KEY = os.environ.get("MASTER_ENCRYPTION_KEY", secrets.token_hex(32)).encode()[:32]
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_urlsafe(48)).encode()


def generate_random_token(nbytes: int = 24) -> str:
    """Generate cryptographically secure random token."""
    return secrets.token_urlsafe(nbytes)


def calculate_sha256(data: bytes) -> str:
    """Compute SHA-256 hexadecimal hash."""
    return hashlib.sha256(data).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hashed, password)
    except (VerifyMismatchError, Exception):
        return False


def generate_file_key() -> bytes:
    """Generate 256-bit AES Data Encryption Key (DEK)."""
    return AESGCM.generate_key(bit_length=256)


def encrypt_file(data: bytes) -> Dict[str, Any]:
    """
    Encrypt file data using AES-256-GCM with a unique per-file DEK.
    DEK is wrapped with master key using AES-256-GCM.
    """
    dek = generate_file_key()
    nonce = secrets.token_bytes(12)  # 96-bit nonce
    aesgcm = AESGCM(dek)
    ciphertext = aesgcm.encrypt(nonce, data, None)

    # Wrap DEK with Master Key
    master_aes = AESGCM(MASTER_KEY)
    dek_nonce = secrets.token_bytes(12)
    wrapped_dek = master_aes.encrypt(dek_nonce, dek, None)
    wrapped_key_str = f"{dek_nonce.hex()}:{wrapped_dek.hex()}"

    return {
        "ciphertext": ciphertext,
        "nonce_hex": nonce.hex(),
        "wrapped_dek": wrapped_key_str,
        "sha256_original": calculate_sha256(data),
        "sha256_encrypted": calculate_sha256(ciphertext)
    }


def decrypt_file(ciphertext: bytes, nonce_hex: str, wrapped_dek_str: str) -> bytes:
    """
    Unwrap DEK using Master Key and decrypt AES-256-GCM ciphertext.
    Authenticates ciphertext integrity; raises exception if modified.
    """
    dek_nonce_hex, enc_dek_hex = wrapped_dek_str.split(":")
    master_aes = AESGCM(MASTER_KEY)
    dek = master_aes.decrypt(bytes.fromhex(dek_nonce_hex), bytes.fromhex(enc_dek_hex), None)

    aesgcm = AESGCM(dek)
    nonce = bytes.fromhex(nonce_hex)
    return aesgcm.decrypt(nonce, ciphertext, None)


def sign_access_token(payload: Dict[str, Any]) -> str:
    """Sign access credential using HMAC-SHA256."""
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    import json
    payload_str = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    msg = f"{header}.{payload_str}".encode()
    signature = base64.urlsafe_b64encode(hmac.new(JWT_SECRET, msg, hashlib.sha256).digest()).decode().rstrip("=")
    return f"{header}.{payload_str}.{signature}"
