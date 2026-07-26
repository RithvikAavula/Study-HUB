"""
Run once: python reset_chroma.py
Deletes the old 384-dim collection and recreates it with 1536 dims.
"""
import os
from dotenv import load_dotenv
load_dotenv()

import chromadb
from chromadb.config import Settings as ChromaSettings

host = os.environ["CHROMA_HOST"]
api_key = os.environ["CHROMA_API_KEY"]
tenant = os.environ["CHROMA_TENANT"]
database = os.environ["CHROMA_DATABASE"]
collection_name = os.environ.get("CHROMA_COLLECTION", "study_hub_embeddings")

client = chromadb.HttpClient(
    host=host,
    ssl=True,
    headers={"x-chroma-token": api_key},
    settings=ChromaSettings(
        chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
        chroma_client_auth_credentials=api_key,
        chroma_server_authn_provider="chromadb.auth.token_authn.TokenAuthenticationServerProvider",
    ),
    tenant=tenant,
    database=database,
)

try:
    client.delete_collection(name=collection_name)
    print(f"✅ Deleted collection: {collection_name}")
except Exception as e:
    print(f"⚠️  Could not delete (may not exist): {e}")

collection = client.create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine", "embedding_dim": 1536},
)
print(f"✅ Created new collection: {collection_name} with dim=1536")
print(f"   Count: {collection.count()}")
