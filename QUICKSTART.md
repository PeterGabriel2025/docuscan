# DocuScan Quick Setup

## 5-Minute Netlify Deployment

### Step 1: Get GCP Credentials
1. [Google Cloud Console](https://console.cloud.google.com) → New Project
2. Enable Vision API (search "Vision API" → Enable)
3. APIs & Services → Credentials → Create Service Account
4. Name: `docuscan-ocr` → Create & Continue
5. Add role: "Cloud Vision API User" → Continue → Create Key
6. Download as JSON
7. Extract these values from JSON:
   - `project_id`
   - `client_email`
   - `private_key` (with `\n`)

### Step 2: Push to GitHub
```bash
cd docuscan
git init
git add .
git commit -m "DocuScan deployment"
git remote add origin https://github.com/YOUR_USERNAME/docuscan
git push -u origin main
```

### Step 3: Deploy to Netlify
1. [Netlify](https://app.netlify.com) → Add new site → Import existing project
2. Choose GitHub → Select repository
3. Build settings: Leave defaults
4. Click **Show advanced** → New variable
5. Add 3 variables (from Step 1):
   - `GOOGLE_VISION_PROJECT_ID` = your-project-id
   - `GOOGLE_VISION_CLIENT_EMAIL` = email@project.iam.gserviceaccount.com
   - `GOOGLE_VISION_PRIVATE_KEY` = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
6. Click **Deploy**
7. Wait 2-3 minutes
8. Visit your site URL (e.g., https://docuscan.netlify.app)

### Test It
1. Fill exam form → Continue
2. Upload image → Extract Text
3. Check editor for extracted text
4. Export as PDF or print

---

## Troubleshooting (Most Common)

| Problem | Solution |
|---------|----------|
| "Function not found" | Check `netlify.toml` exists, re-deploy |
| "Auth failed" | Verify Vision API enabled in GCP Console |
| "No text detected" | Image quality too low, try better photo |
| "Request timeout" | Image too large, compress to < 5MB |

---

## File Checklist

Ensure these files exist in root:
- ✅ `docuscan.html` (main app)
- ✅ `netlify.toml` (config)
- ✅ `package.json` (dependencies)
- ✅ `functions/ocr.js` (backend)
- ✅ `.env.example` (reference)
- ✅ `.gitignore` (git config)

---

## Local Development

```bash
npm install
netlify dev
# Visit http://localhost:8888
```

---

## Environment Variables Cheat Sheet

```
GOOGLE_VISION_PROJECT_ID=your-project-id
GOOGLE_VISION_CLIENT_EMAIL=your-email@project-id.iam.gserviceaccount.com
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

Add to Netlify dashboard: Settings → Build & Deploy → Environment

---

**For complete guide, see DEPLOYMENT.md**

Still stuck? Check function logs: Netlify Dashboard → Functions → ocr
