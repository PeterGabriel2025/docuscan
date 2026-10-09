# DocuScan Quick Setup

## 5-Minute Netlify Deployment

### Step 1: Push to GitHub
```bash
cd docuscan
git init
git add .
git commit -m "DocuScan deployment"
git remote add origin https://github.com/YOUR_USERNAME/docuscan
git push -u origin main
```

### Step 2: Deploy to Netlify
1. [Netlify](https://app.netlify.com) → Add new site → Import existing project
2. Choose GitHub → Select repository
3. Build settings: Leave defaults
4. Click **Deploy**
5. Wait 2-3 minutes
6. Visit your site URL (e.g., https://docuscan.netlify.app)

### Test It
1. Fill exam form → Continue
2. Tap **Open Gemini** and keep DocuScan open
3. In Gemini, use its attachment button to take photos or choose them from your phone gallery (up to 10 per message)
4. Copy the supplied prompt into Gemini and send it with the images
5. Copy Gemini's transcription back into DocuScan
6. Review the text, then export as PDF or print

---

## Troubleshooting (Most Common)

| Problem | Solution |
|---------|----------|
| Gemini did not open | Allow pop-ups for DocuScan, then tap **Open Gemini** again |
| A page image is missing | In Gemini, use its attachment button to take or select the missing page |
| More than 10 pages | Process them in batches of up to 10, then combine the transcriptions |
| Transcription is unclear | Take a clear, well-lit photo in Gemini, keeping the full page in focus |

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

The Gemini-tab workflow does not require an API key. The separate Netlify OCR function only needs `GEMINI_API_KEY` if it is called directly.

---

**For complete guide, see DEPLOYMENT.md**

Still stuck? Check function logs: Netlify Dashboard → Functions → ocr
