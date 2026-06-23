# DocuScan v2.0

**Snap. Convert. Edit. Print.**

A production-ready document OCR and examination paper management system built with Netlify Functions and Google Vision API.

## Features

✨ **Image Upload & OCR**
- Drag & drop image upload
- Mobile camera capture support
- Google Vision API for accurate text extraction
- Real-time extraction status

📝 **Powerful Editor**
- Side-by-side original image + editable text
- AI-powered cleanup tools:
  - Fix question numbering
  - Remove extra spaces
  - Auto-punctuation
  - Add/remove questions

📄 **Export Options**
- **PDF Download** - Professional formatting with school header
- **Print** - Direct browser print
- **Copy** - Copy all text to clipboard

🏫 **Exam Management**
- Select term, session, subject, class, duration
- Auto-generates professional exam header
- Maintains branding and formatting

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/docuscan.git
cd docuscan
npm install
```

### 2. Set Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your Google Cloud credentials (see DEPLOYMENT.md).

### 3. Local Development

```bash
netlify dev
```

Visit `http://localhost:8888`

### 4. Deploy to Netlify

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step guide.

---

## Architecture

### Frontend
- **Framework:** Vanilla HTML5 + CSS3 + JavaScript
- **No dependencies** (production-ready single file)
- **Responsive design** - Mobile, tablet, desktop

### Backend
- **Netlify Functions** - Serverless Node.js
- **Google Vision API** - OCR engine
- **Secure** - API keys in environment variables

### Data Flow
1. User uploads image
2. Frontend compresses and converts to base64
3. Sends to `/.netlify/functions/ocr`
4. Function authenticates with Google Vision
5. Vision API extracts text
6. Text returned to frontend
7. User can edit and export

---

## File Structure

```
docuscan/
├── docuscan.html              # Main application (single file)
├── netlify.toml               # Netlify configuration
├── package.json               # Dependencies
├── functions/
│   └── ocr.js                 # Netlify Function backend
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_VISION_PROJECT_ID` | Yes | GCP Project ID |
| `GOOGLE_VISION_CLIENT_EMAIL` | Yes | Service account email |
| `GOOGLE_VISION_PRIVATE_KEY` | Yes | Service account private key |

See DEPLOYMENT.md for setup instructions.

### Netlify

Configuration file: `netlify.toml`

```toml
[build]
  functions = "functions"
  publish = "."

[env.production]
  GOOGLE_VISION_API_KEY = ""
```

---

## API Reference

### OCR Endpoint

**POST** `/.netlify/functions/ocr`

**Request:**
```json
{
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response:**
```json
{
  "success": true,
  "text": "EXAMINATION PAPER...",
  "warning": null
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Image file is too large (max 20MB)"
}
```

---

## Usage Guide

### Step 1: Exam Details
- Select examination type (1st, 2nd, 3rd term)
- Choose academic session
- Pick subject from dropdown or custom
- Select class (JSS/SS)
- Set exam duration

### Step 2: Upload Image
- Drag & drop or click to browse
- Supports JPG, PNG, WEBP
- Mobile: tap to use camera
- Max file size: 20MB

### Step 3: Extract & Edit
- System extracts text automatically
- Review and correct errors
- Use toolbar for quick fixes
- Add/remove questions as needed

### Step 4: Preview & Export
- View final formatted paper
- Download as PDF
- Print directly
- Copy text to clipboard

---

## Troubleshooting

### OCR Not Working

**Error: "Function not found"**
- Ensure `netlify.toml` is in root
- Ensure `functions/ocr.js` exists
- Redeploy on Netlify

**Error: "Authentication failed"**
- Check environment variables are set
- Verify Vision API is enabled in GCP
- Check service account has correct permissions

**Error: "No text detected"**
- Image quality may be too low
- Try image with better contrast
- Ensure text is readable

**Error: "Request timeout"**
- Image may be too large
- Try compressing to < 5MB
- Check internet connection

### Local Development Issues

**Port already in use:**
```bash
netlify dev --port 3000
```

**Functions not working locally:**
- Ensure `npm install` completed
- Check `netlify dev` shows "Functions ready"
- Check `.env` file exists and is populated

---

## Performance

### Optimization Tips

- **Image size:** Compress to < 5MB for fastest results
- **Image quality:** Use high-quality scans or photos
- **Text:** Ensure good contrast and legibility
- **Format:** JPG recommended for photos, PNG for scans

### Processing Times
- Small image (< 2MB): 2-5 seconds
- Medium image (2-10MB): 5-15 seconds
- Large image (10-20MB): 15-60 seconds

---

## Security

✅ **Implemented:**
- API keys stored in Netlify environment variables
- No credentials in frontend code
- Backend validates all inputs
- Image size limits prevent DoS
- Error messages don't leak sensitive info
- HTTPS enforced by Netlify

⚠️ **Production Recommendations:**
- Enable CORS if needed
- Add rate limiting
- Monitor API usage
- Rotate service account keys regularly

---

## Costs

### Google Vision API
- **Free tier:** 1,000 requests/month
- **Paid:** $1.50 per 1,000 requests
- (Actual costs depend on usage)

### Netlify
- **Free:** 125,000 function invocations/month
- **Paid:** Professional features available

---

## Browser Support

| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ | Latest |
| Firefox | ✅ | Latest |
| Safari | ✅ | Latest |
| Edge | ✅ | Latest |
| Mobile | ✅ | iOS 14+, Android 8+ |

---

## License

MIT License - Use freely for personal and commercial projects.

---

## Support

- 📖 **Docs:** See DEPLOYMENT.md
- 🐛 **Issues:** Create GitHub issue
- 💬 **Discussion:** GitHub Discussions

---

## Version History

### v2.0.0 (Current)
- Migrated from client-side OCR to backend architecture
- Google Vision API integration
- Netlify Functions backend
- Secure environment variable handling
- Enhanced error handling
- Production-ready deployment

### v1.0.0 (Legacy)
- Initial release with Tesseract.js
- Browser-based OCR

---

## Roadmap

Future enhancements:
- [ ] Batch upload (multiple files)
- [ ] OCR result caching
- [ ] Advanced editing (formatting, images)
- [ ] Direct email delivery
- [ ] Cloud storage integration
- [ ] Multi-language support
- [ ] Admin dashboard

---

**Made with ❤️ for educators**

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

Last updated: June 17, 2026
