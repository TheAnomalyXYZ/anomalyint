from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="CommonForms API - Test")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "CommonForms API",
        "status": "running",
        "message": "Test deployment without CommonForms",
        "port": os.environ.get("PORT", "unknown")
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "port": os.environ.get("PORT", "unknown")}

@app.post("/detect-fields")
async def detect_fields_test():
    return {
        "success": True,
        "message": "Test endpoint - CommonForms temporarily disabled",
        "fieldsDetected": True
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
