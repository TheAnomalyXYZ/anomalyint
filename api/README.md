# API Endpoints

## Save Questions Endpoint

**Endpoint:** `POST /api/save-questions`

This endpoint allows you to create and save questions directly to the database.

### Request Body

```json
{
  "questions": [
    {
      "agentId": "cm4r123abc",
      "title": "Will Elon Musk announce a new Tesla model by March 2025?",
      "description": "This market resolves YES if Elon Musk or Tesla officially announces a new Tesla vehicle model before March 31, 2025.",
      "categories": ["Technology", "Automotive"],
      "resolutionCriteria": "Resolves YES if Tesla officially announces a new model. Resolves NO otherwise.",
      "answerEndAt": "2025-03-25T00:00:00Z",
      "settlementAt": "2025-03-31T23:59:59Z",
      "liveDate": "2025-01-01T00:00:00Z",
      "state": "pending"
    }
  ]
}
```

### Request Parameters

Each question object in the `questions` array must include:

- `agentId` (required): The ID of the agent creating this question
- `title` (required): The question title/text
- `resolutionCriteria` (required): How the question will be resolved
- `answerEndAt` (required): ISO date string when answering closes
- `settlementAt` (required): ISO date string when the question resolves
- `description` (optional): Additional context for the question
- `categories` (optional): Array of category strings. If not provided, automatically uses the agent's categories
- `liveDate` (optional): ISO date string when question goes live
- `state` (optional): Question state - `'pending'`, `'approved'`, or `'published'` (default: `'pending'`)
- `aiScore` (optional): AI quality score from 0.00 to 1.00 (default: `0.75`). Questions appear in "All AI Agent Generated" section

### Response

Success response (200):
```json
{
  "success": 1,
  "failed": 0,
  "total": 1,
  "questions": [
    {
      "id": "gq1765898457064_0",
      "title": "Will Elon Musk announce a new Tesla model by March 2025?"
    }
  ]
}
```

Partial success response (200):
```json
{
  "success": 1,
  "failed": 1,
  "total": 2,
  "questions": [
    {
      "id": "gq1765898457064_0",
      "title": "Will Elon Musk announce a new Tesla model by March 2025?"
    }
  ],
  "errors": [
    "Agent not found: invalid_agent_id"
  ]
}
```

Error response (400):
```json
{
  "error": "Invalid questions array"
}
```

Error response (500):
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### Example Usage

#### cURL
```bash
curl -X POST https://your-domain.vercel.app/api/save-questions \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "agentId": "cm4r123abc",
        "title": "Will Elon Musk announce a new Tesla model by March 2025?",
        "resolutionCriteria": "Resolves YES if Tesla officially announces a new model.",
        "answerEndAt": "2025-03-25T00:00:00Z",
        "settlementAt": "2025-03-31T23:59:59Z"
      }
    ]
  }'
```

#### JavaScript/Fetch
```javascript
const response = await fetch('/api/save-questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    questions: [
      {
        agentId: 'cm4r123abc',
        title: 'Will Elon Musk announce a new Tesla model by March 2025?',
        description: 'This market resolves YES if Elon Musk or Tesla officially announces a new Tesla vehicle model before March 31, 2025.',
        categories: ['Technology', 'Automotive'],
        resolutionCriteria: 'Resolves YES if Tesla officially announces a new model. Resolves NO otherwise.',
        answerEndAt: '2025-03-25T00:00:00Z',
        settlementAt: '2025-03-31T23:59:59Z',
        state: 'pending'
      }
    ]
  })
});

const result = await response.json();
console.log(`Created ${result.success} questions, ${result.failed} failed`);
```

#### n8n Webhook
You can configure your n8n workflow to POST directly to this endpoint.

1. Add an HTTP Request node after your question generation logic
2. Set Method to POST
3. Set URL to `https://your-domain.vercel.app/api/save-questions`
4. Set Body to JSON with the questions array
5. The response will tell you how many questions were successfully created

### Environment Variables

The endpoint requires the following environment variables to be set:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY`: Supabase authentication key

### Notes

- The endpoint validates that the `agentId` exists before creating questions
- **Categories are automatically inherited from the agent** if not provided in the request
- **AI Score defaults to 0.75** if not provided, ensuring questions appear in "All AI Agent Generated" section
- All questions are created with default values for pool sizes (0) and answer count (0)
- The `created_at` and `updated_at` timestamps are automatically set
- Questions default to `'pending'` state if not specified
- Question IDs are auto-generated in the format: `gq{timestamp}_{random}`

---

## Save Ratings Endpoint

**Endpoint:** `POST /api/save-ratings`

This endpoint allows you to save Nova ratings directly to the database without going through the NovaProcessingModal.

### Request Body

```json
{
  "ratings": [
    {
      "questionId": "gq1765814091400_0",
      "rating": "S",
      "ratingCategory": "Short Time Frame & Verifiable",
      "confidence": 85,
      "sparkline": [75, 80, 85]
    },
    {
      "questionId": "gq1765814091400_1",
      "rating": "A",
      "ratingCategory": "High Quality Market",
      "confidence": 92,
      "sparkline": [88, 90, 92]
    }
  ]
}
```

### Request Parameters

Each rating object in the `ratings` array must include:

- `questionId` (required): The ID of the question to rate
- `rating` (required): The rating value, one of: `'A'`, `'B'`, `'C'`, `'D'`, `'E'`, `'F'`, or `'S'`
- `ratingCategory` (required): A string describing the category/reason for the rating (required to support multiple ratings per question)
- `confidence` (optional): Confidence score as a number (0-100)
- `sparkline` (optional): Array of numbers representing confidence history over time

### Response

Success response (200):
```json
{
  "success": 2,
  "failed": 0,
  "total": 2
}
```

Partial success response (200):
```json
{
  "success": 1,
  "failed": 1,
  "total": 2,
  "errors": [
    "Error creating rating for gq1765814091400_1: duplicate key value violates unique constraint"
  ]
}
```

Error response (400):
```json
{
  "error": "Invalid ratings array"
}
```

Error response (500):
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### Example Usage

#### cURL
```bash
curl -X POST https://your-domain.vercel.app/api/save-ratings \
  -H "Content-Type: application/json" \
  -d '{
    "ratings": [
      {
        "questionId": "gq1765814091400_0",
        "rating": "S",
        "ratingCategory": "Short Time Frame & Verifiable"
      }
    ]
  }'
```

#### JavaScript/Fetch
```javascript
const response = await fetch('/api/save-ratings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ratings: [
      {
        questionId: 'gq1765814091400_0',
        rating: 'S',
        ratingCategory: 'Short Time Frame & Verifiable',
        confidence: 85,
        sparkline: [75, 80, 85]
      }
    ]
  })
});

const result = await response.json();
console.log(`Saved ${result.success} ratings, ${result.failed} failed`);
```

#### n8n Webhook
You can configure your n8n workflow to POST directly to this endpoint instead of relying on the NovaProcessingModal timeout.

1. Add an HTTP Request node after your Nova rating logic
2. Set Method to POST
3. Set URL to `https://your-domain.vercel.app/api/save-ratings`
4. Set Body to JSON with the ratings array
5. The response will tell you how many ratings were successfully saved

### Environment Variables

The endpoint requires the following environment variables to be set:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY`: Supabase authentication key

### Notes

- The endpoint will automatically create new ratings or update existing ones based on `questionId`
- All ratings in the request are processed independently - partial failures are possible
- If a rating already exists for a question, it will be updated with the new values
- The `created_at` timestamp is only set when creating a new rating
- The `updated_at` timestamp is updated on every save operation
