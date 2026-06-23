# DocuScan v2.0 - Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         DocuScan Frontend (docuscan.html)             │  │
│  │  - Image upload (drag/drop, camera, browse)          │  │
│  │  - Form validation (term, session, subject, etc)     │  │
│  │  - Base64 encoding                                   │  │
│  │  - API call to Netlify Function                      │  │
│  │  - Text editor with cleanup tools                    │  │
│  │  - PDF generation (jsPDF)                            │  │
│  │  - Print interface                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS
                          │ POST /.netlify/functions/ocr
                          │ { imageData: "data:image/..." }
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Netlify Platform                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │       Netlify Functions (Node.js Runtime)             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         functions/ocr.js Handler              │  │  │
│  │  │  - Parse request body                         │  │  │
│  │  │  - Validate image data                        │  │  │
│  │  │  - Check file size (max 20MB)                 │  │  │
│  │  │  - Load GCP credentials from env vars         │  │  │
│  │  │  - Create Vision API client                   │  │  │
│  │  │  - Call Google Vision DOCUMENT_TEXT_DETECTION │  │  │
│  │  │  - Return extracted text                      │  │  │
│  │  │  - Error handling & status codes              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │ Environment Variables:                               │  │
│  │ - GOOGLE_VISION_PROJECT_ID                          │  │
│  │ - GOOGLE_VISION_CLIENT_EMAIL                        │  │
│  │ - GOOGLE_VISION_PRIVATE_KEY                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS
                          │ gRPC call
                          │ Service Account authentication
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          Google Cloud Vision API                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │     Cloud Vision DOCUMENT_TEXT_DETECTION              │  │
│  │  - WASM-based OCR engine                             │  │
│  │  - Supports 100+ languages                           │  │
│  │  - Returns:                                          │  │
│  │    * Full text annotation                            │  │
│  │    * Confidence scores                               │  │
│  │    * Layout information                              │  │
│  │    * Entity boundaries                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Image Upload
```
User clicks upload → File selected
    ↓
HTML5 FileReader API → Convert to Base64 data URL
    ↓
appState.imageDataURL = "data:image/png;base64,..."
    ↓
Display preview in UI
```

### 2. OCR Processing
```
User clicks "Extract Text"
    ↓
startOCR() function called
    ↓
Display loading spinner
    ↓
POST to /.netlify/functions/ocr with { imageData: "..." }
    ↓
Netlify Function receives request
    ↓
Decode base64 → Buffer
    ↓
Load Google Cloud credentials from environment
    ↓
Create Vision API client
    ↓
Call Vision API with buffer
    ↓
Vision processes image → Returns full text annotation
    ↓
Extract text string from response
    ↓
Return to frontend: { success: true, text: "..." }
    ↓
Display text in editor
```

### 3. Text Editing
```
User sees extracted text
    ↓
User can:
  - Edit manually in textarea
  - Use AI cleanup tools
  - Add/remove questions
  - Preview changes in real-time
```

### 4. Export
```
User clicks "Preview" → Goes to step 4
    ↓
PDF: Uses jsPDF library to generate formatted PDF
     └─ Server-side: None (purely client-side)
     
Print: Uses browser print dialog
       └─ Server-side: None (uses CSS @media print)
       
Copy: navigator.clipboard.writeText()
      └─ Server-side: None (uses browser API)
```

---

## API Endpoints

### Netlify Function: OCR

**Endpoint:** `/.netlify/functions/ocr`

**Method:** `POST`

**Content-Type:** `application/json`

#### Request

```javascript
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

#### Response (Success)

```javascript
{
  "success": true,
  "text": "GREAT TURNING POINT INTERNATIONAL SCHOOL\nUMUODE...",
  "warning": null
}
```

#### Response (No Text Found)

```javascript
{
  "success": true,
  "text": "",
  "warning": "No text detected in the provided image"
}
```

#### Response (Error)

```javascript
{
  "success": false,
  "error": "Image file is too large (max 20MB)"
}
```

#### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Text extracted successfully |
| 400 | Bad Request | Invalid image format |
| 405 | Method Not Allowed | Used GET instead of POST |
| 413 | Payload Too Large | Image > 20MB |
| 500 | Server Error | Vision API auth failed |

---

## Security Architecture

### Frontend (docuscan.html)
✅ No API keys anywhere in code
✅ No direct Google Vision API calls
✅ Image data only sent to Netlify Function
✅ Error messages don't leak credentials

### Backend (functions/ocr.js)
✅ Credentials loaded from environment only
✅ Input validation (format, size)
✅ Output validation (check for success flag)
✅ Error handling without exposing sensitive info
✅ Request/response encryption (HTTPS enforced by Netlify)

### Netlify Configuration (netlify.toml)
✅ Environment variables not in version control
✅ Functions defined in secure directory
✅ Build command locked down

### GCP Service Account
✅ Scoped to Vision API only
✅ Separate from application credentials
✅ Can be rotated independently
✅ Audit logs available in GCP Console

---

## Performance Characteristics

### Image Processing Time

| Image Size | Processing Time | Notes |
|------------|-----------------|-------|
| < 1MB | 1-3 seconds | Optimal |
| 1-5MB | 3-10 seconds | Recommended |
| 5-10MB | 10-30 seconds | Acceptable |
| 10-20MB | 30-60 seconds | Slow |
| > 20MB | Rejected | Max limit |

### Netlify Functions Limits

- **Cold start:** ~1 second (first request)
- **Warm start:** ~100ms (subsequent requests)
- **Timeout:** 26 seconds default
- **Memory:** 1024MB allocated
- **Payload size:** 6MB limit

### Google Vision API Limits

- **Request size:** 20MB max
- **Rate:** 1,000 requests/min (free tier limits)
- **Response time:** Usually < 5 seconds

---

## Error Handling Strategy

### Frontend Error Handling

```javascript
try {
  // Call function
  const response = await fetch(OCR_ENDPOINT, {...});
  
  if (!response.ok) {
    // Handle HTTP errors
    if (response.status === 404) → "Function not found"
    if (response.status === 500) → "Server error"
    if (response.status === 413) → "File too large"
  }
  
  const data = await response.json();
  if (!data.success) → "Show error message"
  
  if (!data.text) → "No text detected warning"
  
} catch (err) {
  if (err.name === 'AbortError') → "Timeout error"
  if (err instanceof TypeError) → "Network error"
}
```

### Backend Error Handling

```javascript
try {
  // Process request
  validateInput(imageData);
  const buffer = decodeImage(imageData);
  validateSize(buffer);
  
  const result = await visionAPI.call(buffer);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, text: result })
  };
  
} catch (error) {
  // Categorize error
  if (auth_error) → Return 500 with generic message
  if (invalid_input) → Return 400 with helpful message
  if (too_large) → Return 413 with specific message
  
  log_error_for_debugging();
}
```

---

## Deployment Flow

### Local Development
```
npm install
↓
netlify dev
↓
http://localhost:8888 (frontend)
http://localhost:8888/.netlify/functions/ocr (backend)
```

### Production Deployment
```
git push origin main
↓
Netlify detects push
↓
Runs build command (npm install)
↓
Bundles functions
↓
Deploys to Netlify CDN
↓
Functions available at https://[site].netlify.app/.netlify/functions/ocr
```

---

## Configuration Files

### netlify.toml
Defines:
- Build command
- Functions directory
- Publish directory
- Environment redirects
- Environment-specific variables

### package.json
Defines:
- Node.js version requirement
- Dependencies (@google-cloud/vision)
- Dev dependencies (netlify-cli)
- Build scripts

### .env.example
Template for:
- GOOGLE_VISION_PROJECT_ID
- GOOGLE_VISION_CLIENT_EMAIL
- GOOGLE_VISION_PRIVATE_KEY

### functions/ocr.js
Netlify Function that:
- Handles POST requests
- Validates image data
- Calls Google Vision API
- Returns extracted text

### docuscan.html
Frontend that:
- Manages UI state
- Calls OCR endpoint
- Displays results
- Handles exports

---

## Scalability Considerations

### Current Setup (v2.0)
- ✅ Handles 1,000+ concurrent users (Netlify scales automatically)
- ✅ 125,000 free function invocations/month
- ✅ Can process ~4,000+ images/month within free tier
- ✅ Auto-scales with demand

### Optimization Options
- Add caching layer (Redis)
- Implement request queue (Bull, RabbitMQ)
- Add image compression before upload
- Cache Vision API results
- Add rate limiting per user/IP

### Cost Scaling
- Netlify Functions: Free up to 125k invocations, then $0.25/100k
- Google Vision: Free up to 1,000/month, then $1.50/1,000
- Example: 5,000 images/month = ~$7.50 Vision costs

---

## Monitoring & Debugging

### Netlify Dashboard
- View function logs
- Monitor invocations
- Check error rates
- Track execution time

### GCP Console
- Monitor API usage
- Check service account activity
- View audit logs
- Set up billing alerts

### Frontend Console
- Browser DevTools for network requests
- Check API response payloads
- Monitor function timing
- Error logging

---

## Version History

### v2.0.0 (Current)
**Architecture:** Backend + Frontend
- Secure credential handling
- Production deployment ready
- Scalable infrastructure
- Professional error handling

### v1.0.0 (Legacy)
**Architecture:** Client-side only
- Tesseract.js
- No backend
- API key exposure risk
- Not production-ready

---

## Future Improvements

- [ ] Add image compression before upload
- [ ] Implement request caching
- [ ] Add user authentication
- [ ] Database for exam history
- [ ] Admin dashboard
- [ ] Advanced image preprocessing
- [ ] Multi-language support
- [ ] Batch processing
- [ ] WebSocket for real-time updates
- [ ] CI/CD pipeline integration

---

**Last Updated:** June 17, 2026

For deployment, see DEPLOYMENT.md
For quick setup, see QUICKSTART.md
