# CommonForms API Service

FastAPI service for PDF form field detection and filling using CommonForms.

## Deployment to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect the Python service
5. Set the root directory to `python-service`
6. Railway will automatically install dependencies and deploy

## Environment Variables

No environment variables required for basic operation.

## Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /detect-fields` - Detect form fields in PDF
- `POST /fill-form` - Fill form with AI (coming soon)

## Local Development

```bash
cd python-service
pip install -r requirements.txt
python main.py
```

Service will run on `http://localhost:8000`

## API Usage

```bash
# Detect fields
curl -X POST http://localhost:8000/detect-fields \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "https://example.com/form.pdf"}'
```
