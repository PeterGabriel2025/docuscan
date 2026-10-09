# DocuScan v2.0 - Production Deployment Guide

## Architecture Overview

```
User Browser (Frontend)
        ↓
   Upload Image
        ↓
Netlify Functions (Backend)
        ↓
  Gemini Vision Model
        ↓
  Extracted Text
        ↓
   User Browser
```

## Prerequisites

- Git account
- Google AI Studio account with Gemini API access
- Netlify account (free tier supported)
- Node.js 18+ (for local development)

---

## Step 1: Set Up Gemini API Access

### 1.1 Create an API Key

1. Open Google AI Studio
2. Create a new API key
3. Copy the key and store it securely

### 1.2 Choose a Vision Model

The Netlify function defaults to `gemini-3.8-flash`. You can override this with `GEMINI_VISION_MODEL` if you want to use a different vision-capable Gemini model.

---

## Step 2: Deploy to Netlify

### 2.1 Connect Repository

1. Push your project to GitHub (or GitLab/Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "DocuScan v2.0 production deployment"
   git remote add origin https://github.com/YOUR_USERNAME/docuscan.git
   git push -u origin main
   ```

2. Go to [Netlify](https://app.netlify.com)
3. Click **Add new site** → **Import an existing project**
4. Select your Git provider and authorize
5. Find and select your `docuscan` repository

### 2.2 Configure Build Settings

1. In Netlify, after selecting repo:
   - **Base directory:** (leave empty)
   - **Build command:** `npm install` (or leave empty)
   - **Publish directory:** `.` (current directory)
2. Click **Show advanced** → **New variable**

### 2.3 Add Environment Variables

In Netlify, add these environment variables:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_VISION_MODEL` | `gemini-3.8-flash` or another vision-capable Gemini model |

### 2.4 Deploy

1. Click **Deploy**
2. Netlify will build and deploy your site
3. Your site URL will be: `https://[SITE-NAME].netlify.app`

---

## Step 3: Verify Deployment

### Test the OCR Function

1. Open your deployed site
2. Fill in exam details → Upload an image
3. Click **Extract Text**
4. If successful, text will appear in the editor

### Troubleshooting

**"OCR function not found" error:**
- Ensure `netlify.toml` is in root directory
- Ensure `functions/ocr.js` exists
- Re-deploy on Netlify

**"Authentication failed" error:**
- Verify environment variables are set correctly
- Verify `GEMINI_API_KEY` is valid and available to the deployed context
- Check your Google AI Studio or Google Cloud project access

**Large image timeouts:**
- Maximum image size is 20MB
- Recommend compressing images to < 5MB for faster processing

---

## Step 4: Local Development (Optional)

### Run Locally with Netlify Dev

```bash
# Install dependencies
npm install

# Start development server with Netlify Functions
netlify dev
```

This runs:
- Frontend on `http://localhost:8888`
- Functions on `http://localhost:8888/.netlify/functions/*`
- Uses environment variables from `netlify.toml` or `.env`

---

## Environment Variables Reference

Create a `.env` file (never commit to Git):

```
GEMINI_API_KEY=your-gemini-api-key
GEMINI_VISION_MODEL=gemini-3.8-flash
```

Add to `.gitignore`:
```
.env
.env.local
node_modules/
.netlify/
```

---

## API Endpoint Reference

### OCR Function

**URL:** `/.netlify/functions/ocr`  
**Method:** POST  
**Content-Type:** application/json

**Request:**
```json
{
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "text": "Extracted examination questions...",
  "warning": null
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Image file is too large (max 20MB)"
}
```

**Error Codes:**
- `200 OK` - Text extracted (may be empty)
- `400 Bad Request` - Invalid image data or format
- `405 Method Not Allowed` - Wrong HTTP method
- `413 Payload Too Large` - Image > 20MB
- `500 Internal Server Error` - API authentication or processing error

---

## File Structure

```
docuscan/
├── docuscan.html              # Main application (frontend)
├── netlify.toml               # Netlify configuration
├── package.json               # Node.js dependencies
├── functions/
│   └── ocr.js                 # Netlify Function (backend)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── DEPLOYMENT.md              # This file
```

---

## Production Checklist

- [ ] Gemini API key created
- [ ] Environment variables added to Netlify
- [ ] Code pushed to GitHub/GitLab
- [ ] Netlify connected to Git repository
- [ ] Build settings configured
- [ ] Site deployed successfully
- [ ] OCR endpoint tested with sample image
- [ ] Error handling verified
- [ ] PDF export tested
- [ ] Print functionality tested
- [ ] Domain configured (optional)

---

## Costs & Limits

### Gemini API Pricing
- Usage is billed by model and token/image processing volume
- Check your Google AI Studio or Google Cloud dashboard for current pricing and limits

### Netlify
- Free tier: Unlimited builds, 125k compute minutes/month
- Functions: 125,000 invocations/month free

### Image Limits
- Maximum size: 20MB
- Recommended: < 5MB for optimal performance
- Supported formats: JPG, PNG, GIF, WEBP, TIFF, BMP, PDF (single page)

---

## Security Best Practices

✅ **Implemented:**
- API key stored in Netlify environment variables
- No credentials exposed in frontend code
- Backend validates all inputs
- Image size validation (prevents DoS)
- Error messages don't leak sensitive info

⚠️ **Additional Recommendations:**
- Enable CORS restrictions if needed
- Add rate limiting (Netlify Analytics)
- Monitor function usage in Netlify dashboard
- Regularly rotate API keys
- Use a custom domain with SSL (automatic with Netlify)

---

## Support & Troubleshooting

### Logs

View function logs:
1. Netlify dashboard → **Functions** → **ocr**
2. See real-time execution logs

### Contact Google AI Support

If Gemini API issues persist, check your Google AI Studio or Google Cloud dashboard for usage, billing, and project access details.

---

## Version Information

- **DocuScan Version:** 2.0.0
- **Node.js:** 18.x
- **Gemini Vision Model:** `gemini-3.8-flash` by default
- **PDF Library:** jsPDF 2.5.1
- **Deployment Platform:** Netlify

---

**Last Updated:** June 17, 2026

For updates and issues, refer to your Git repository.
