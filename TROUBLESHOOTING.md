# DocuScan Troubleshooting Guide

## Common Issues & Solutions

---

## 1. "OCR function not found" Error

### Symptoms
- Error message appears after uploading image
- "OCR function not found. Ensure Netlify Functions are deployed."

### Causes
- Function file not deployed
- netlify.toml missing or misconfigured
- Build step failed silently

### Solutions

**Check 1: File exists**
```bash
ls functions/ocr.js  # Should exist
```

**Check 2: netlify.toml is present**
```bash
ls netlify.toml  # Should be in root directory
```

**Check 3: netlify.toml is correct**
```toml
[build]
  functions = "functions"  # Must point to functions directory

[functions]
  node_bundler = "esbuild"
```

**Check 4: Redeploy**
1. Netlify dashboard → Deploys
2. Click "Trigger deploy"
3. Wait for build to complete
4. Check build logs for errors

**Check 5: Build logs**
1. Netlify dashboard → Deploys → Latest deploy
2. Click "Deploy log"
3. Look for "Functions ready" message
4. If error, resolve and redeploy

---

## 2. "Authentication failed" Error

### Symptoms
- "Authentication failed. Check GOOGLE_VISION_* environment variables."

### Causes
- Environment variables not set
- Credentials incomplete
- Private key format incorrect

### Solutions

**Check 1: Environment variables set**
1. Netlify dashboard → Settings → Build & Deploy → Environment
2. Verify all 3 variables present:
   - `GOOGLE_VISION_PROJECT_ID`
   - `GOOGLE_VISION_CLIENT_EMAIL`
   - `GOOGLE_VISION_PRIVATE_KEY`

**Check 2: Private key format**
The private key must:
- Include `-----BEGIN PRIVATE KEY-----` at start
- Include `-----END PRIVATE KEY-----` at end
- Include `\n` characters for newlines
- Be wrapped in quotes

**Example (correct):**
```
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

**Example (incorrect):**
```
GOOGLE_VISION_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQ...
-----END PRIVATE KEY-----
```

**Check 3: Get fresh credentials**
1. GCP Console → Service Accounts
2. Find `docuscan-ocr` account
3. Keys tab → Create new JSON key
4. Download and extract fresh values
5. Update Netlify environment variables
6. Redeploy

**Check 4: Verify Vision API enabled**
1. GCP Console → APIs & Services → Library
2. Search "Vision API"
3. Click Vision API
4. Should show "API enabled"
5. If not, click "Enable"

---

## 3. "Permission denied" Error

### Symptoms
- "Permission denied. Ensure Vision API is enabled in your GCP project."

### Causes
- Service account doesn't have correct role
- Vision API not enabled for project
- Wrong project ID used

### Solutions

**Check 1: Verify role assignment**
1. GCP Console → IAM & Admin → IAM
2. Find service account email
3. Should have "Cloud Vision API User" role
4. If not, add it:
   - Click Edit (pencil icon)
   - Add Role → "Cloud Vision API User"
   - Save

**Check 2: Confirm Vision API enabled**
1. GCP Console → APIs & Services → Library
2. Search "Cloud Vision API"
3. If not enabled, click "Enable"
4. Wait for activation

**Check 3: Check project ID matches**
1. GCP Console → Settings (gear icon)
2. Note your Project ID
3. Netlify dashboard → Environment variables
4. Verify `GOOGLE_VISION_PROJECT_ID` matches exactly

---

## 4. "No text detected" Warning

### Symptoms
- Image uploads successfully
- OCR processes but returns empty text
- "No text detected in the provided image"

### Causes
- Image quality too low
- Text too small or blurry
- Poor contrast
- Image doesn't contain text
- Language not English

### Solutions

**Try these image improvements:**
1. Better lighting (no shadows)
2. Higher resolution (at least 150 DPI)
3. Straight angle (not tilted)
4. High contrast (dark text on light background)
5. Larger text (at least 12pt font)

**For documents:**
- Use scanner instead of camera when possible
- Ensure text is clearly printed
- Avoid folds, creases, or stains

**For photos:**
- Take from directly above
- Avoid glare and reflections
- Ensure entire page is in frame
- Use good lighting

---

## 5. "Request timeout" Error

### Symptoms
- Processing takes > 60 seconds
- "Request timeout. Image processing took too long."

### Causes
- Image too large
- Poor internet connection
- Google Vision API overloaded
- Multiple requests competing

### Solutions

**Solution 1: Compress image**
1. Use online image compressor
2. Reduce file size to < 5MB
3. Maintain reasonable quality
4. Retry upload

**Solution 2: Check file size**
- Max allowed: 20MB
- Recommended: < 5MB
- Typical timing: 2-15 seconds

**Solution 3: Retry**
- Wait 30 seconds
- Upload same image again
- Sometimes temporary API slowness

**Solution 4: Check connection**
- Test internet speed: speedtest.net
- Ensure upload isn't throttled
- Try wired connection if on WiFi

---

## 6. "Image file is too large" Error

### Symptoms
- Error: "Image file is too large (max 20MB)"

### Causes
- File literally exceeds 20MB limit
- Common with TIFF or uncompressed formats

### Solutions

**Use online compressor:**
1. Visit: https://compressor.io or tinypng.com
2. Upload image
3. Download compressed version
4. Retry upload (should be < 5MB)

**Or use command line (Mac/Linux):**
```bash
# Reduce file size to 50% quality
convert input.jpg -quality 50 output.jpg

# Resize to max width of 2000px
convert input.jpg -resize 2000x output.jpg
```

**Or use Windows:**
1. Right-click image → Open with → Photos
2. Click Edit & Create → Crop & rotate
3. Save with compression

---

## 7. Function Works Locally but Not After Deploy

### Symptoms
- `netlify dev` works fine
- After deploying to Netlify, OCR fails
- Works in some regions but not others

### Causes
- Environment variables not propagated
- Node modules not bundled correctly
- Build cache issues

### Solutions

**Solution 1: Clear build cache**
1. Netlify dashboard → Deploys
2. Click menu (···) on latest deploy
3. "Clear cache and redeploy"
4. Wait for rebuild

**Solution 2: Verify environment variables**
1. Netlify dashboard → Functions
2. Click `ocr` function
3. Check environment variables loaded
4. If not showing, re-enter them

**Solution 3: Check build log**
1. Netlify dashboard → Deploys → Latest
2. Click "Deploy log"
3. Look for errors in build section
4. Search for "node_modules" or "error"

**Solution 4: Force fresh deploy**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

---

## 8. 502 Bad Gateway Error

### Symptoms
- "502 Bad Gateway" after clicking Extract
- Something went wrong on the server

### Causes
- Function crashed
- Out of memory
- Unhandled exception
- Google Vision API unreachable

### Solutions

**Check 1: Function logs**
1. Netlify dashboard → Functions → ocr
2. Scroll to bottom for recent logs
3. Look for error messages
4. Note exact error

**Check 2: Common causes**
- **Memory issue:** Reduce image size
- **Timeout:** Function took > 26 seconds
- **API issue:** Google Vision API down

**Check 3: Check GCP Status**
1. Visit: https://status.cloud.google.com
2. Check if Vision API has issues
3. If down, wait for resolution

**Check 4: Retry**
1. Wait 30 seconds
2. Upload a smaller image
3. Try again

---

## 9. Image Uploads But Text Editor Stays Empty

### Symptoms
- Image processes without errors
- Text editor appears but is blank
- No error message shown

### Causes
- Vision API returned empty result
- Response not parsed correctly
- Editor not updated with result

### Solutions

**Check browser console:**
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for error messages
4. Note any red errors
5. Screenshot and share

**Check network tab:**
1. DevTools → Network tab
2. Refresh page
3. Upload image again
4. Click request to `/.netlify/functions/ocr`
5. Check response body
6. Should show extracted text

---

## 10. Local Development Issues

### "Functions not ready" message

**Symptoms:**
- `netlify dev` shows error
- "Functions ready" never appears

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear Netlify cache
rm -rf .netlify

# Try again
netlify dev
```

### "Cannot find module" error

**Symptoms:**
- Error: "Cannot find module '@google-cloud/vision'"

**Solutions:**
```bash
# Install dependencies
npm install

# Verify installation
npm list @google-cloud/vision

# Should show version 4.5.0 or higher
```

### Port already in use

**Symptoms:**
- Error: "Port 8888 already in use"

**Solutions:**
```bash
# Use different port
netlify dev --port 3000

# Kill process on port 8888
# Mac/Linux
lsof -i :8888 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :8888
taskkill /PID [PID] /F
```

---

## 11. PDF Export Issues

### "PDF generation failed"

**This is frontend only, should always work**

**If failing:**
1. Check browser console for errors
2. Ensure jsPDF library loaded (check network tab)
3. Try in different browser
4. Refresh page and retry

---

## 12. Print Issues

### "Print preview shows blank"

**Solutions:**
1. Close DevTools (F12)
2. Ensure page fully loaded
3. Try Ctrl+P (Cmd+P on Mac) again
4. Try different print option (Save as PDF)

---

## Getting Help

### Check These First
- ✅ Environment variables set correctly
- ✅ Vision API enabled in GCP
- ✅ Service account has correct role
- ✅ netlify.toml exists in root
- ✅ functions/ocr.js exists
- ✅ Image file < 20MB
- ✅ Image has readable text

### Debug Steps
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Note exact error text
5. Check Network tab for API responses
6. View Netlify function logs

### Contact Support
If stuck:
1. Screenshot error message
2. Note image size and format
3. Check function logs
4. Check console errors
5. Try with different image
6. Create GitHub issue with details

---

**Last Updated:** June 17, 2026

For more help, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [QUICKSTART.md](QUICKSTART.md) - Quick reference
