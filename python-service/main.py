from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
import urllib.request
from commonforms import prepare_form

app = FastAPI(title="CommonForms API")

# Enable CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DetectFieldsRequest(BaseModel):
    pdfUrl: str

class FillFormRequest(BaseModel):
    pdfUrl: str
    context: dict = {}

@app.get("/")
async def root():
    return {
        "service": "CommonForms API",
        "status": "running",
        "endpoints": {
            "detect": "/detect-fields",
            "fill": "/fill-form"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/detect-fields")
async def detect_fields(request: DetectFieldsRequest):
    """
    Detect form fields in a PDF using CommonForms
    """
    try:
        print(f"[detect-fields] Attempting to download PDF from: {request.pdfUrl}")
        # Download the PDF from R2 with proper headers to avoid Cloudflare bot detection
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input:
            try:
                req = urllib.request.Request(
                    request.pdfUrl,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                )
                with urllib.request.urlopen(req) as response:
                    temp_input.write(response.read())
            except Exception as download_error:
                print(f"[detect-fields] Download failed: {type(download_error).__name__}: {str(download_error)}")
                raise
            temp_input_path = temp_input.name

        # Create temporary output file
        temp_output = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_output_path = temp_output.name
        temp_output.close()

        try:
            # Use CommonForms to detect and add form fields
            # Using default parameters as per CommonForms 0.2.1 API
            prepare_form(
                temp_input_path,
                temp_output_path
            )

            # Read the output PDF
            with open(temp_output_path, 'rb') as f:
                output_pdf_data = f.read()

            # TODO: Upload the processed PDF back to R2
            # For now, return success with metadata

            return {
                "success": True,
                "message": "Form fields detected successfully",
                "outputSize": len(output_pdf_data),
                "fieldsDetected": True
            }

        finally:
            # Clean up temporary files
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path):
                os.unlink(temp_output_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Form field detection failed: {str(e)}"
        )

@app.post("/fill-form")
async def fill_form(request: FillFormRequest):
    """
    Fill form fields in a PDF using AI
    """
    try:
        # Download the PDF from R2 with proper headers
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input:
            req = urllib.request.Request(
                request.pdfUrl,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            )
            with urllib.request.urlopen(req) as response:
                temp_input.write(response.read())
            temp_input_path = temp_input.name

        # Create temporary output file
        temp_output = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_output_path = temp_output.name
        temp_output.close()

        try:
            # Use CommonForms to detect and add form fields
            prepare_form(
                temp_input_path,
                temp_output_path
            )

            # Read the output PDF
            with open(temp_output_path, 'rb') as f:
                output_pdf_data = f.read()

            # TODO: Extract field names and use AI to generate values
            # TODO: Fill the form with AI-generated values

            return {
                "success": True,
                "message": "Form prepared with detected fields",
                "outputSize": len(output_pdf_data),
                "note": "AI-powered filling coming in next iteration"
            }

        finally:
            # Clean up temporary files
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path):
                os.unlink(temp_output_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Form filling failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
