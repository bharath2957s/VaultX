"""
VaultX Automated Security Tests
Pytest suite covering Cryptography, Tamper Detection, Access Control
"""

import pytest
from app.crypto.vault_crypto import (
    encrypt_file, decrypt_file, hash_password, verify_password,
    calculate_sha256, generate_random_token, sign_access_token
)

def test_aes_gcm_authenticated_encryption():
    payload = b"Top secret operational data 2026"
    enc = encrypt_file(payload)

    assert enc["ciphertext"] != payload
    assert len(enc["nonce_hex"]) == 24  # 12 bytes = 24 hex chars
    assert len(enc["sha256_original"]) == 64

    decrypted = decrypt_file(enc["ciphertext"], enc["nonce_hex"], enc["wrapped_dek"])
    assert decrypted == payload

def test_tamper_detection_bit_flip():
    payload = b"Financial transaction records"
    enc = encrypt_file(payload)

    # Flip one bit in ciphertext
    tampered = bytearray(enc["ciphertext"])
    tampered[0] ^= 0x01

    with pytest.raises(Exception):
        decrypt_file(bytes(tampered), enc["nonce_hex"], enc["wrapped_dek"])

def test_argon2id_password_hashing():
    password = "CorrectHorseBatteryStaple#99"
    hashed = hash_password(password)

    assert hashed.startswith("$argon2id$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_sha256_integrity():
    data = b"Integrity check payload"
    h1 = calculate_sha256(data)
    h2 = calculate_sha256(data)
    assert h1 == h2
    assert len(h1) == 64
