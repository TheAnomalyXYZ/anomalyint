from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
import urllib.request
from commonforms import prepare_form
import cv2
import numpy as np
import fitz  # PyMuPDF
from typing import List, Dict, Any
import pytesseract
from PIL import Image

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

class AnnotatePdfRequest(BaseModel):
    pdfUrl: str
    fields: List[Dict[str, Any]]

@app.get("/")
async def root():
    return {
        "service": "CommonForms API",
        "status": "running",
        "endpoints": {
            "detect": "/detect-fields",
            "fill": "/fill-form",
            "detectFillableAreas": "/detect-fillable-areas",
            "detectTableCells": "/detect-table-cells",
            "annotatePdf": "/annotate-pdf"
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

def detect_horizontal_lines(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Detect horizontal lines that could be fillable underscores
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Higher thresholds to avoid detecting text edges as lines
    edges = cv2.Canny(gray, 150, 250, apertureSize=3)

    # Detect lines using HoughLinesP
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)

    horizontal_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            # Check if line is roughly horizontal (small y difference)
            if abs(y2 - y1) < 10 and abs(x2 - x1) > 200:
                horizontal_lines.append({
                    "type": "line",
                    "x": int(min(x1, x2)),
                    "y": int(min(y1, y2)),
                    "width": int(abs(x2 - x1)),
                    "height": 20
                })

    return horizontal_lines

def detect_table_cells(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Detect table structure and cells
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)[1]

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    cells = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        # Filter for rectangular shapes that could be table cells
        if w > 50 and h > 15 and w < image.shape[1] * 0.9:
            cells.append({
                "type": "cell",
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            })

    return cells

def extract_text_with_positions(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Extract text and their positions using OCR
    """
    try:
        # Convert to PIL Image for pytesseract
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        # Get detailed OCR data
        ocr_data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT)

        text_elements = []
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            if text:  # Only include non-empty text
                text_elements.append({
                    "text": text,
                    "x": int(ocr_data['left'][i]),
                    "y": int(ocr_data['top'][i]),
                    "width": int(ocr_data['width'][i]),
                    "height": int(ocr_data['height'][i]),
                    "confidence": float(ocr_data['conf'][i])
                })

        return text_elements
    except Exception as e:
        print(f"OCR failed: {str(e)}")
        return []

def associate_labels_with_fields(text_elements: List[Dict], fields: List[Dict]) -> List[Dict]:
    """
    Associate text labels with detected fillable fields
    """
    for field in fields:
        # Find text to the left of the field
        nearby_text = []
        for text_elem in text_elements:
            # Check if text is to the left and roughly on the same line
            if (text_elem['x'] < field['x'] and
                abs(text_elem['y'] - field['y']) < 30):
                nearby_text.append(text_elem)

        # Sort by distance and take the closest
        if nearby_text:
            nearby_text.sort(key=lambda t: field['x'] - (t['x'] + t['width']))
            field['label'] = ' '.join([t['text'] for t in nearby_text[:5]])
        else:
            field['label'] = ""

    return fields

@app.post("/detect-fillable-areas")
async def detect_fillable_areas(request: DetectFieldsRequest):
    """
    Detect fillable areas in a PDF using computer vision
    """
    try:
        print(f"[detect-fillable-areas] Downloading PDF from: {request.pdfUrl}")

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

        try:
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(temp_input_path)
            all_fillable_areas = []
            total_pages = len(pdf_document)

            # Process each page
            for page_num in range(total_pages):
                page = pdf_document[page_num]

                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scale for better quality
                img_data = pix.tobytes("png")

                # Convert to numpy array for OpenCV
                nparr = np.frombuffer(img_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # Detect horizontal lines (underscore fields) only
                lines = detect_horizontal_lines(image)
                print(f"Page {page_num + 1}: Found {len(lines)} horizontal lines")

                # Extract text with positions
                text_elements = extract_text_with_positions(image)
                print(f"Page {page_num + 1}: Extracted {len(text_elements)} text elements")

                # Use only line fields for this endpoint
                all_fields = lines

                # Associate labels with fields
                labeled_fields = associate_labels_with_fields(text_elements, all_fields)

                # Add page number to each field
                for field in labeled_fields:
                    field['page'] = page_num + 1

                all_fillable_areas.extend(labeled_fields)

            pdf_document.close()

            # Group fields by page for better organization
            fields_by_page = {}
            for field in all_fillable_areas:
                page = field.get('page', 1)
                if page not in fields_by_page:
                    fields_by_page[page] = {
                        "lines": [],
                        "cells": [],
                        "all_fields": []
                    }

                fields_by_page[page]["all_fields"].append(field)
                if field['type'] == 'line':
                    fields_by_page[page]["lines"].append(field)
                elif field['type'] == 'cell':
                    fields_by_page[page]["cells"].append(field)

            return {
                "success": True,
                "message": "Fillable areas detected successfully",
                "totalPages": total_pages,
                "fieldsDetected": len(all_fillable_areas),
                "fields": all_fillable_areas,  # Return all fields
                "fieldsByPage": fields_by_page,  # Organized by page
                "summary": {
                    "totalLines": sum(1 for f in all_fillable_areas if f['type'] == 'line'),
                    "totalCells": sum(1 for f in all_fillable_areas if f['type'] == 'cell'),
                }
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)

    except Exception as e:
        print(f"[detect-fillable-areas] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Fillable area detection failed: {str(e)}"
        )

@app.post("/detect-table-cells")
async def detect_table_cells_endpoint(request: DetectFieldsRequest):
    """
    Detect table cells and structured form fields in PDF using contour detection.
    This is more aggressive and may find overlapping regions.
    """
    try:
        print(f"[detect-table-cells] Downloading PDF from: {request.pdfUrl}")

        # Download the PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input:
            req = urllib.request.Request(
                request.pdfUrl,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            with urllib.request.urlopen(req) as response:
                temp_input.write(response.read())
            temp_input_path = temp_input.name

        try:
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(temp_input_path)
            all_fillable_areas = []
            total_pages = len(pdf_document)

            # Process each page
            for page_num in range(total_pages):
                page = pdf_document[page_num]

                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scale for better quality
                img_data = pix.tobytes("png")

                # Convert to numpy array for OpenCV
                nparr = np.frombuffer(img_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # Detect table cells only
                cells = detect_table_cells(image)
                print(f"Page {page_num + 1}: Found {len(cells)} table cells")

                # Extract text with positions
                text_elements = extract_text_with_positions(image)
                print(f"Page {page_num + 1}: Extracted {len(text_elements)} text elements")

                # Use only cell fields for this endpoint
                all_fields = cells

                # Associate labels with fields
                labeled_fields = associate_labels_with_fields(text_elements, all_fields)

                # Add page number to each field
                for field in labeled_fields:
                    field['page'] = page_num + 1

                all_fillable_areas.extend(labeled_fields)

            pdf_document.close()

            # Group fields by page for better organization
            fields_by_page = {}
            for field in all_fillable_areas:
                page = field.get('page', 1)
                if page not in fields_by_page:
                    fields_by_page[page] = {
                        "cells": [],
                        "all_fields": []
                    }

                fields_by_page[page]["all_fields"].append(field)
                if field['type'] == 'cell':
                    fields_by_page[page]["cells"].append(field)

            return {
                "success": True,
                "message": "Table cells detected successfully",
                "totalPages": total_pages,
                "fieldsDetected": len(all_fillable_areas),
                "fields": all_fillable_areas,  # Return all fields
                "fieldsByPage": fields_by_page,  # Organized by page
                "summary": {
                    "totalCells": sum(1 for f in all_fillable_areas if f['type'] == 'cell'),
                }
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)

    except Exception as e:
        print(f"[detect-table-cells] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Table cell detection failed: {str(e)}"
        )

@app.post("/annotate-pdf")
async def annotate_pdf(request: AnnotatePdfRequest):
    """
    Create an annotated PDF with detected fields marked
    """
    try:
        print(f"[annotate-pdf] Downloading PDF from: {request.pdfUrl}")

        # Download the PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input:
            req = urllib.request.Request(
                request.pdfUrl,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            with urllib.request.urlopen(req) as response:
                temp_input.write(response.read())
            temp_input_path = temp_input.name

        # Create output file
        temp_output = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_output_path = temp_output.name
        temp_output.close()

        try:
            # Open PDF
            pdf_document = fitz.open(temp_input_path)

            # Group fields by page
            fields_by_page = {}
            for field in request.fields:
                page = field.get('page', 1)
                if page not in fields_by_page:
                    fields_by_page[page] = []
                fields_by_page[page].append(field)

            # Annotate each page
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                page_fields = fields_by_page.get(page_num + 1, [])

                # Clean page contents to standardize orientation before drawing
                page.clean_contents()

                # Check for page rotation
                page_rotation = page.rotation
                print(f"[annotate-pdf] Page {page_num + 1} rotation: {page_rotation} degrees")

                # Calculate actual scale factor used during detection
                # Detection uses: pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                # Get actual page dimensions (unrotated)
                page_rect = page.rect
                page_width = page_rect.width
                page_height = page_rect.height

                # Get pixmap dimensions (what was used during detection)
                detection_pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                pixmap_width = detection_pix.width
                pixmap_height = detection_pix.height

                # Calculate scale factors
                scale_x = pixmap_width / page_width
                scale_y = pixmap_height / page_height

                for field in page_fields:
                    # Scale coordinates back from detection resolution to PDF points
                    # After page.clean_contents(), coordinate system is standardized
                    # Use image coordinates directly without Y-axis flip
                    x = field['x'] / scale_x
                    y = field['y'] / scale_y
                    width = field['width'] / scale_x
                    height = field['height'] / scale_y

                    # Draw X marker
                    # Use lighter red for transparency effect (RGB: 1.0, 0.3, 0.3)
                    red = (1, 0.3, 0.3)

                    # Draw X from top-left to bottom-right
                    page.draw_line(
                        fitz.Point(x, y),
                        fitz.Point(x + width, y + height),
                        color=red,
                        width=2
                    )
                    # Draw X from top-right to bottom-left
                    page.draw_line(
                        fitz.Point(x + width, y),
                        fitz.Point(x, y + height),
                        color=red,
                        width=2
                    )

                    # Draw bounding box
                    rect = fitz.Rect(x, y, x + width, y + height)
                    page.draw_rect(rect, color=red, width=1)

                    # Add label with type and coordinates
                    label = f"{field['type']}: ({field['x']},{field['y']})"

                    # Position label above the field
                    label_y = y - 5
                    if label_y < 0:
                        label_y = y + height + 12

                    # Draw text directly on PDF (no background)
                    page.insert_text(
                        fitz.Point(x, label_y),
                        label,
                        fontsize=8,
                        color=red
                    )

            # Save annotated PDF
            pdf_document.save(temp_output_path)
            pdf_document.close()

            # Read the annotated PDF
            with open(temp_output_path, 'rb') as f:
                import base64
                pdf_data = base64.b64encode(f.read()).decode('utf-8')

            return {
                "success": True,
                "message": "PDF annotated successfully",
                "annotatedPdf": pdf_data,  # Base64 encoded PDF
                "fieldsAnnotated": len(request.fields)
            }

        finally:
            # Clean up temporary files
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            if os.path.exists(temp_output_path):
                os.unlink(temp_output_path)

    except Exception as e:
        print(f"[annotate-pdf] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"PDF annotation failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[STARTUP] Starting server on port {port}")
    print(f"[STARTUP] PORT env var: {os.environ.get('PORT', 'NOT SET')}")
    uvicorn.run(app, host="0.0.0.0", port=port)
