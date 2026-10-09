# DocuScan v2.0

**Snap. Convert. Edit. Print.**

A phone-friendly examination paper tool for preparing, editing, and exporting questions transcribed with Gemini.

## Features

✨ **AI-Assisted Image Transcription**
- Open Gemini and attach up to 10 exam-page images per batch
- Take photos or select images directly inside Gemini on your phone
- Copy a transcription prompt, then paste the AI response back into DocuScan
- Review and edit the transcription before exporting

📝 **Powerful Editor**
- Editable text with exam details
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

### 2. Local Development

```bash
netlify dev
```

Visit `http://localhost:8888`

### 3. Deploy to Netlify

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step guide.

---

## Architecture

### Frontend
- **Framework:** Vanilla HTML5 + CSS3 + JavaScript
- **No dependencies** (production-ready single file)
- **Responsive design** - Mobile, tablet, desktop

### Manual AI Transcription Flow
1. DocuScan opens Gemini in a separate tab and provides a transcription prompt
2. Teacher takes photos or selects up to 10 page images directly inside Gemini
3. Teacher sends the images with the prompt, then copies Gemini's transcription back into DocuScan to edit and export

The teacher handles images and transcription in Gemini; DocuScan does not access the phone camera, upload images, or send them to Gemini automatically. A separate Netlify OCR endpoint remains in the project but is not part of this teacher workflow.

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
| `GEMINI_API_KEY` | No for the website workflow | Used only if the separate Netlify OCR endpoint is called directly |
| `GEMINI_VISION_MODEL` | No | Model for the separate OCR endpoint; defaults to `gemini-3.8-flash` |

The Gemini-tab workflow in the website does not require an API key.

### Netlify

Configuration file: `netlify.toml`

```toml
[build]
  functions = "functions"
  publish = "."
```

Only configure `GEMINI_API_KEY` in Netlify if you separately use the OCR endpoint; do not put the key in `netlify.toml`.

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

### Step 2: Prepare Pages for Gemini
- Tap **Open Gemini** and keep DocuScan open in another tab
- In Gemini, use the attachment button to take photos or choose images from the phone gallery
- Attach up to 10 pages in one message; process additional pages in batches
- Copy the provided transcription prompt into Gemini and send it with the images

### Step 3: Extract & Edit
- Copy Gemini's response
- Paste Gemini's response into DocuScan and select **Continue to Exam Editor**
- Review and correct the questions
- Use toolbar for quick fixes
- Add/remove questions as needed

### Step 4: Preview & Export
- View final formatted paper
- Download as PDF
- Print directly
- Copy text to clipboard

---

## Troubleshooting

### Gemini transcription workflow

**Gemini did not open**
- Open DocuScan in your phone's main browser (Safari or Chrome) and tap **Open Gemini** again. In-app browsers may not open external apps correctly.

**Page photos are not attached in Gemini**
- In Gemini, use its attachment button to take photos or choose them from your phone's gallery.

**There are more than 10 pages**
- Transcribe pages in batches of up to 10 and combine the returned text before pasting it into DocuScan.

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
- Rotate API keys regularly

---

## Costs

### Gemini API
- Usage is billed by model and token/image processing volume
- See your Google AI Studio or Google Cloud dashboard for current pricing and limits

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
- Gemini vision model integration
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

Copyright (c) 2026 DocuScan. All rights reserved.

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

Last updated: June 17, 2026
