from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import urllib.request
from commonforms import prepare_form

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get the request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            pdf_url = data.get('pdfUrl')
            context = data.get('context', {})  # User-provided context for form filling

            if not pdf_url:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Missing pdfUrl parameter'
                }).encode())
                return

            # Download the PDF from R2
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input:
                with urllib.request.urlopen(pdf_url) as response:
                    temp_input.write(response.read())
                temp_input_path = temp_input.name

            # Create temporary output file for processed PDF
            temp_output = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
            temp_output_path = temp_output.name
            temp_output.close()

            try:
                # Step 1: Use CommonForms to detect and add form fields
                prepare_form(
                    temp_input_path,
                    temp_output_path,
                    model='FFDNet-S',
                    confidence=0.3,
                    device='cpu',
                    fast=True,
                    multiline=True  # Support multi-line text inputs
                )

                # Step 2: Extract detected fields and use AI to fill them
                # TODO: Use PyPDF2 or similar to extract field names
                # TODO: Use OpenAI to generate appropriate values based on context
                # TODO: Fill the form fields programmatically

                # For now, just return the PDF with detected fields
                # The user can manually fill it or we can add AI filling in next iteration

                # Read the output PDF
                with open(temp_output_path, 'rb') as f:
                    output_pdf_data = f.read()

                # TODO: Upload the filled PDF back to R2
                # For now, return success with metadata

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                response_data = {
                    'success': True,
                    'message': 'Form prepared with detected fields',
                    'outputSize': len(output_pdf_data),
                    'note': 'AI-powered filling coming in next iteration'
                }

                self.wfile.write(json.dumps(response_data).encode())

            finally:
                # Clean up temporary files
                if os.path.exists(temp_input_path):
                    os.unlink(temp_input_path)
                if os.path.exists(temp_output_path):
                    os.unlink(temp_output_path)

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Form filling failed',
                'message': str(e)
            }).encode())

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
