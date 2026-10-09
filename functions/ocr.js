/**
 * Netlify Function: OCR handler for DocuScan
 * Uses Gemini vision models via Google's Gemini API.
 *
 * Request JSON: { imageData: 'data:image/...;base64,...' }
 * Response JSON: { success: boolean, text?: string, error?: string }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

function parseDataURL(dataURL) {
  if (typeof dataURL !== 'string') throw new Error('imageData must be a string');
  const match = dataURL.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/i);
  if (!match || !match[2]) throw new Error('Expected a base64 JPEG, PNG, or WEBP image');
  const header = `data:${match[1]};base64`;
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw new Error('The uploaded image is empty');
  return { header, base64, buffer };
}

function ensureImageSize(buffer, maxBytes = 4 * 1024 * 1024) {
  if (buffer.length > maxBytes) {
    throw new Error(`Image size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`);
  }
}

function extractInteractionText(data) {
  const directText = [data?.output_text, data?.outputText]
    .filter(value => typeof value === 'string' && value.trim());
  if (directText.length) return directText.join('\n').trim();

  const textBlocks = [
    ...(Array.isArray(data?.outputs) ? data.outputs : []),
    ...(Array.isArray(data?.output) ? data.output : [])
  ];
  const outputText = textBlocks
    .filter(block => block?.type === 'text')
    .map(block => typeof block.text === 'string' ? block.text : block.text?.text || '')
    .filter(Boolean);
  if (outputText.length) return outputText.join('\n').trim();

  const stepText = (Array.isArray(data?.steps) ? data.steps : [])
    .flatMap(step => step?.content || step?.modelOutput?.content || step?.model_output?.content || [])
    .map(content => typeof content?.text === 'string' ? content.text : content?.text?.text || '')
    .filter(Boolean);

  return stepText.join('\n').trim();
}

exports.handler = async (event) => {
  console.log('[ocr] Handler invoked', event.httpMethod);

  // Respond to preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Only allow POST
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

  let image;
  try {
    console.log('[ocr] Validating data URL');
    image = parseDataURL(imageData);
    ensureImageSize(image.buffer);
  } catch (err) {
    const status = err?.message?.includes('exceeds') ? 413 : 400;
    return buildResponse(status, { success: false, error: err?.message || 'Invalid image data' });
  }

  try {
    const { header, base64, buffer } = image;
    console.log('[ocr] Image header:', header);
    console.log('[ocr] Raw bytes:', buffer.length);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.log('[ocr] GEMINI_API_KEY/GOOGLE_API_KEY present:', !!apiKey);
    if (!apiKey) {
      console.error('[ocr] No GEMINI_API_KEY or GOOGLE_API_KEY found in environment');
      return buildResponse(500, { success: false, error: 'Server misconfigured: missing credentials' });
    }

    const model = process.env.GEMINI_VISION_MODEL || 'gemini-3.8-flash';
    const prompt = 'Transcribe all readable text in this exam page, including handwritten and printed questions. Preserve the original wording, numbering, section headings, answer choices, symbols, and line breaks as closely as possible. Do not solve, summarize, or invent content. Mark any unreadable word as [unclear]. Return only the transcription.';
    const mimeType = (header.match(/^data:([^;]+);base64$/) || [])[1] || 'image/jpeg';

    const requestBody = {
      model,
      input: [
        { type: 'text', text: prompt },
        { type: 'image', data: base64, mime_type: mimeType }
      ]
    };

    const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    console.log('[ocr] Sending request to Gemini endpoint', GEMINI_ENDPOINT);

    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    const responseText = await response.text();
    console.log('[ocr] Gemini status:', response.status);

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

    const extracted = extractInteractionText(data);
    console.log('[ocr] Extracted length:', extracted.length);

    if (!extracted) {
      console.error('[ocr] Gemini returned no transcription', {
        status: data?.status || 'unknown',
        responseKeys: Object.keys(data || {}),
        outputTypes: (data?.outputs || []).map(output => output?.type).filter(Boolean)
      });
      return buildResponse(502, { success: false, error: 'No text was recognized. Try a clearer, well-lit photo with the page filling the frame.' });
    }

    return buildResponse(200, { success: true, text: extracted });

  } catch (err) {
    const errorDetail = err && err.stack ? err.stack : Object.assign({ message: err?.message }, err);
    console.error('[ocr] Processing error:', errorDetail);
    const msg = err?.message || 'OCR processing failed';
    return buildResponse(500, { success: false, error: msg });
  }
};
