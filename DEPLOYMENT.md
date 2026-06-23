# DocuScan v2.0 - Production Deployment Guide

## Architecture Overview

```
User Browser (Frontend)
        ↓
   Upload Image
        ↓
Netlify Functions (Backend)
        ↓
  Google Vision API
        ↓
  Extracted Text
        ↓
   User Browser
```

## Prerequisites

- Git account
- Google Cloud Platform (GCP) account
- Netlify account (free tier supported)
- Node.js 18+ (for local development)

---

## Step 1: Set Up Google Cloud Vision API

### 1.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: **New Project** → Name: `DocuScan` → **Create**
3. Wait for project to be created, then select it

### 1.2 Enable Vision API

1. In the console, search for **Vision API**
2. Click **Vision API** from results
3. Click **Enable**
4. Wait for activation to complete

### 1.3 Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service Account Name:** `docuscan-ocr`
   - **Service Account ID:** (auto-filled)
   - Click **Create and Continue**
4. Grant roles:
   - Click **Select a role** → Search `Vision` → Select **Cloud Vision API User**
   - Click **Continue**
5. Click **Create Key**
   - Select **JSON** format
   - Click **Create**
   - **A JSON file will download** - Save it securely

### 1.4 Extract Credentials

Open the downloaded JSON file and extract:
- `project_id`
- `client_email`
- `private_key` (entire multi-line string with `\n`)

**Example:**
```json
{
  "type": "service_account",
  "project_id": "docuscan-12345",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "docuscan-ocr@docuscan-12345.iam.gserviceaccount.com",
  ...
}
```

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

In Netlify, add these environment variables (from Step 1.4):

| Key | Value |
|-----|-------|
| `GOOGLE_VISION_PROJECT_ID` | Your GCP project ID |
| `GOOGLE_VISION_CLIENT_EMAIL` | Service account email |
| `GOOGLE_VISION_PRIVATE_KEY` | Full private key JSON string |

**Important:** For the private key, copy the entire value including `\n` newline characters.

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
- Check private key includes `\n` characters
- Verify Vision API is enabled in GCP

**"Permission denied" error:**
- Ensure service account has "Cloud Vision API User" role
- Go to GCP → Service Accounts → Roles → Verify permissions

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
GOOGLE_VISION_PROJECT_ID=your-project-id
GOOGLE_VISION_CLIENT_EMAIL=your-email@project-id.iam.gserviceaccount.com
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
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

- [ ] Google Cloud Vision API enabled
- [ ] Service account created with proper permissions
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

### Google Vision API Pricing
- Free: 1,000 requests/month
- Paid: $1.50 per 1,000 requests after free tier

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
- Regularly rotate service account keys
- Use a custom domain with SSL (automatic with Netlify)

---

## Support & Troubleshooting

### Logs

View function logs:
1. Netlify dashboard → **Functions** → **ocr**
2. See real-time execution logs

### Contact GCP Support

If Vision API issues persist:
1. Go to Google Cloud Console
2. **Support** → **Create ticket**
3. Provide error messages and function logs

---

## Version Information

- **DocuScan Version:** 2.0.0
- **Node.js:** 18.x
- **Google Cloud Vision:** 4.5.0
- **PDF Library:** jsPDF 2.5.1
- **Deployment Platform:** Netlify

---

**Last Updated:** June 17, 2026

For updates and issues, refer to your Git repository.
