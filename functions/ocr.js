/**
 * Netlify Function: OCR handler for DocuScan
 * Uses Gemini image OCR via Google Generative Language API.
 *
 * Request JSON: { imageData: 'data:image/...;base64,...' }
 * Response JSON: { success: boolean, text?: string, error?: string }
 */

const util = require('util');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

function parseDataURL(dataURL) {
  if (typeof dataURL !== 'string') throw new Error('imageData must be a string');
  const parts = dataURL.split(',');
  if (parts.length !== 2) throw new Error('Invalid data URL format');
  const header = parts[0];
  const base64 = parts[1];
  if (!header.startsWith('data:image/')) throw new Error('Expected data URL of image type');
  const buffer = Buffer.from(base64, 'base64');
  return { header, base64, buffer };
}

function ensureImageSize(buffer, maxBytes = 20 * 1024 * 1024) {
  if (buffer.length > maxBytes) {
    throw new Error(`Image size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`);
  }
}

exports.handler = async (event) => {
  console.log('[ocr] Handler invoked', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('[ocr] Method not allowed:', event.httpMethod);
    return buildResponse(405, { success: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('[ocr] Invalid JSON body');
    return buildResponse(400, { success: false, error: 'Invalid JSON in request body' });
  }

  const imageData = body.imageData;
  if (!imageData) {
    console.error('[ocr] Missing imageData');
    return buildResponse(400, { success: false, error: 'imageData is required' });
  }

  try {
    console.log('[ocr] Parsing data URL');
    const { header, base64, buffer } = parseDataURL(imageData);
    console.log('[ocr] Image header:', header);
    console.log('[ocr] Raw bytes:', buffer.length);
    ensureImageSize(buffer);

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[ocr] GEMINI_API_KEY present:', !!apiKey);
    if (!apiKey) {
      console.error('[ocr] No GEMINI_API_KEY found in environment');
      return buildResponse(500, { success: false, error: 'Server misconfigured: missing credentials' });
    }

    const mimeType = header.replace(/^data:/, '').replace(/;base64$/, '') || 'image/jpeg';
    const prompt = 'Extract all text from this image exactly as written. Preserve numbering, line breaks, punctuation, question formatting. Return only the extracted text.';

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }
      ]
    };

    const endpoint = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
    console.log('[ocr] Sending Gemini request to', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('[ocr] Gemini status:', response.status);
    console.log('[ocr] Gemini response (truncated):', responseText.substring(0, 4000));

    if (!response.ok) {
      let parsed = {};
      try { parsed = JSON.parse(responseText); } catch (e) {}
      const message = parsed?.error?.message || parsed?.error || `Gemini HTTP ${response.status}`;
      console.error('[ocr] Gemini error:', message);
      return buildResponse(response.status, { success: false, error: message });
    }

    let data;
    try { data = JSON.parse(responseText); } catch (err) {
      console.error('[ocr] Invalid JSON from Gemini');
      throw new Error('Invalid response from Gemini');
    }

    const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[ocr] Extracted length:', extracted.length);
    return buildResponse(200, { success: true, text: extracted });

  } catch (err) {
    console.error('[ocr] Processing error:', err && err.stack ? err.stack : util.inspect(err));
    const msg = err.message || 'OCR processing failed';
    const status = (msg && msg.includes('exceeds')) ? 413 : 500;
    return buildResponse(status, { success: false, error: msg });
  }
};
