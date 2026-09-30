"""
VaultX FastAPI Application
"""

import os
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.crypto.vault_crypto import (
    hash_password, verify_password, generate_random_token,
    encrypt_file, decrypt_file, calculate_sha256, sign_access_token
)

app = FastAPI(
    title="VaultX — Zero-Trust File Sharing API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "product": "VaultX",
        "tagline": "Share the file. Keep control.",
        "status": "OPERATIONAL",
        "crypto": "AES-256-GCM + Argon2id"
    }

@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "security_controls": "ACTIVE"}
