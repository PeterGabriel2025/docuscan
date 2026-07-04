/**
 * Netlify Function: OCR handler for DocuScan
 * Uses OpenAI vision models via OpenAI's Chat Completions endpoint.
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
  const parts = dataURL.split(',');
  // ensure header is parts[0] and base64 is parts[1]
  if (!parts[0] || !parts[1]) throw new Error('Invalid data URL format');
  const header = parts[0];
  const base64 = parts[1];
  if (!header.startsWith('data:image/')) throw new Error('Expected data URL of image type');
  const buffer = Buffer.from(base64, 'base64');
  return { header, base64, buffer };
}

function ensureImageSize(buffer, maxBytes = 4 * 1024 * 1024) {
  if (buffer.length > maxBytes) {
    throw new Error(`Image size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`);
  }
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

  try {
    console.log('[ocr] Validating data URL');
    const { header, base64, buffer } = parseDataURL(imageData);
    console.log('[ocr] Image header:', header);
    console.log('[ocr] Raw bytes:', buffer.length);
    ensureImageSize(buffer);

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('[ocr] OPENAI_API_KEY present:', !!apiKey);
    if (!apiKey) {
      console.error('[ocr] No OPENAI_API_KEY found in environment');
      return buildResponse(500, { success: false, error: 'Server misconfigured: missing credentials' });
    }

    // Build request per OpenAI's multimodal chat schema.
    const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
    const prompt = 'Extract all handwritten text from this book page image. Ignore printed text elements. Preserve numbering, line breaks, paragraphs, and punctuation exactly as written. Return only the clean extracted text ready to copy.';

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      temperature: 0.1
    };

    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    console.log('[ocr] Sending request to OpenAI endpoint', OPENAI_ENDPOINT);

    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('[ocr] OpenAI status:', response.status);
    console.log('[ocr] OpenAI response (truncated):', responseText.substring(0, 4000));

    if (!response.ok) {
      let parsed = {};
      try { parsed = JSON.parse(responseText); } catch (e) {}
      const message = parsed?.error?.message || parsed?.error || `OpenAI HTTP ${response.status}`;
      console.error('[ocr] OpenAI error:', message);
      return buildResponse(response.status, { success: false, error: message });
    }

    let data;
    try { data = JSON.parse(responseText); } catch (err) {
      console.error('[ocr] Invalid JSON from OpenAI');
      throw new Error('Invalid response from OpenAI');
    }

    // Safe extraction of generated content
    let extracted = '';
    try {
      const messageContent = data?.choices?.[0]?.message?.content;
      if (!messageContent) {
        // Some APIs return choices[0].message as string or choices[0].text
        extracted = data?.choices?.[0]?.text || '';
      } else if (typeof messageContent === 'string') {
        extracted = messageContent;
      } else if (Array.isArray(messageContent)) {
        // find first text block
        const textBlock = messageContent.find(c => c?.type === 'text' && typeof c?.text === 'string');
        if (textBlock) extracted = textBlock.text;
        else extracted = messageContent.map(c => c?.text || '').filter(Boolean).join('\n');
      } else if (messageContent?.type === 'text' && typeof messageContent?.text === 'string') {
        extracted = messageContent.text;   
      }
    } catch (e) {
      console.warn('[ocr] Failed to parse generated content', e);
    }

    extracted = (extracted || '').trim();
    console.log('[ocr] Extracted length:', extracted.length);

    return buildResponse(200, { success: true, text: extracted });

  } catch (err) {
    const errorDetail = err && err.stack ? err.stack : Object.assign({ message: err?.message }, err);
    console.error('[ocr] Processing error:', errorDetail);
    const msg = err?.message || 'OCR processing failed';
    const status = (msg && msg.includes('exceeds')) ? 413 : 500;
    return buildResponse(status, { success: false, error: msg });
  }
};
