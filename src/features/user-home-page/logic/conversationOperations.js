import { v4 as uuidv4 } from 'uuid';

export function initialConversation() {}

// Build a UI user message object. For Google use `data.parts`; for OpenAI-style use `data.content`.
export function buildUserMessage(text, file = null, modelSelected, filePath) {
  const provider = (modelSelected?.provider || '').toString();
  if ((provider || '').toLowerCase() === 'google') {
    const parts = [{ text: text || '' }];
    const out = { data: { role: 'user', parts } };
    if (filePath) { out.filePath = filePath; out.fileType = file?.type || null; }
    return out;
  }
  // default OpenAI/OpenRouter shape
  const out = { data: { role: 'user', content: text || '' } };
  if (filePath) { out.filePath = filePath; out.fileType = file?.type || null; }
  return out;
}

// Build a UI assistant/AI message object. Mirrors buildUserMessage but role=assistant/model.
export function buildAIResponse(text, file = null, modelSelected) {
  const provider = (modelSelected?.provider || '').toString();
  if ((provider || '').toLowerCase() === 'google') {
    const parts = [{ text: text || '' }];
    return { data: { role: 'model', parts } };
  }
  return { data: { role: 'assistant', content: text || '' } };
}

// Build a normalized attachment row bound to a message and conversation
export function buildStorableAttachment({
  type = 'image',
  mime_type = '',
  file_base64 = '',
  file_url = '',
  size_bytes = null,
  width = null,
  height = null,
  sha256 = null,
  is_encrypted = false,
  enc_algo = null,
  iv_base64 = null,
  key_ref = null
} = {}, { message_id = null, conversation_id = null } = {}) {
  return {
    attachment_id: uuidv4(),
    message_id,
    conversation_id,
    type,
    mime_type: mime_type || null,
    file_base64: file_base64 || null,
    file_url: file_url || null,
    size_bytes,
    width,
    height,
    sha256,
    is_encrypted: !!is_encrypted,
    enc_algo: enc_algo || null,
    iv_base64: iv_base64 || null,
    key_ref: key_ref || null,
    created_at: new Date().toISOString()
  };
}

export function addMessages(setContents, setMessages, modelSelected) {
  // Minimal safe implementation: callers expect addMessages to exist.
  // Keep this as a safe no-op to avoid changing behaviour in other modules.
  const provider = (modelSelected?.provider || '').toString();
  switch (provider) {
    case 'OpenRouter':
    case 'Google':
    default:
      // no-op
  }
}

// Create a new conversation shell. In local mode generate UUID on the client; in fixed/server mode leave it to the backend.
export function preparingConversation({
  user_id = '',
  visitor_id = '',
  title = 'no title',
  local_only = true,
  conversation_id = null
} = {}) {
  const now = new Date().toISOString();
  const id = local_only ? (conversation_id || uuidv4()) : (conversation_id || null);
  return {
    conversation_id: id,
    user_id,
    visitor_id,
    title,
    created_at: now,
    updated_at: now,
    local_only
  };
}

// Normalize conversation object based on storage mode and avoid assigning IDs in fixed mode (server will assign).
export function buildConversation(
  conversation,
  messages,
  contents,
  modelSelected,
  settings,
  isMixedStorage,
  auth
) {
  const out = { ...(conversation || {}) };

  if (isMixedStorage) {
    // Fixed/server mode
    out.local_only = false;
    out.user_id = auth?.data?.user_id || out.user_id || '';
    // Important: Do NOT generate a UUID here; let backend create it to avoid local/server duplication
    out.conversation_id = null;
  } else {
    // Local-only mode (IndexedDB)
    out.local_only = true;
    out.user_id = out.user_id || '';
    if (!out.conversation_id) out.conversation_id = uuidv4();
  }

  const now = new Date().toISOString();
  out.updated_at = now;
  if (!out.created_at) out.created_at = now;

  return out;
}

// Title strictly from the SECOND user message; no assistant/model text involved at all.
export async function autoTitleConversation({
  messages = [],
  contents = [],
  modelSelected,
  generateWithAI,
  minTurns = 2,
  language = 'ar'
}) {
  // generateWithAI is optional; if not provided a local deterministic fallback will be used

  const provider = modelSelected?.provider || 'OpenAI';
  const source = provider === 'Google' ? contents : messages;
  if (!Array.isArray(source) || source.length === 0) return null;

  // Collect only user messages (ignore assistant/model outputs entirely)
  const extractUserText = (entry) => {
    const data = entry?.data ?? entry ?? {};
    const role = provider === 'Google' ? (entry?.role || data.role) : (data.role || entry?.role);
    if (role !== 'user') return null;
    let text = '';
    if (provider === 'Google') {
      const parts = entry?.parts || data?.parts || [];
      text = parts.map(p => p?.text || '').filter(Boolean).join('\n').trim();
    } else {
      const c = data?.content ?? entry?.content;
      if (typeof c === 'string') text = c;
      else if (Array.isArray(c)) text = c.map(p => p?.text || '').filter(Boolean).join(' ').trim();
      else text = String(c ?? '');
    }
    const MAX = 200; // guard excessive size
    return text ? text.slice(0, MAX) : null;
  };

  const userTexts = [];
  let totalTurns = 0;
  for (const t of source) {
    const txt = extractUserText(t);
    const role = (t?.data?.role || t?.data?.role || t?.role || '').toString();
    if (role === 'user') totalTurns++;
    if (txt) userTexts.push(txt);
    if (userTexts.length >= 2 && totalTurns >= minTurns) break;
  }
  if (userTexts.length < 2 || totalTurns < minTurns) {
    // Not enough material yet
    return null;
  }

  // Base the title on the second user message (most indicative of direction)
  const secondUserText = userTexts[1];

  const systemPrompt = language === 'ar'
    ? 'عنون بإيجاز شديد (2–5 كلمات). أعد العنوان فقط دون شرح/تنصيص/رموز.'
    : 'Title very concisely (2–5 words). Return the title only without explanation/quotes/emojis.';
  const userPrompt = (language === 'ar'
    ? 'أنشئ عنواناً موجزاً جداً بناءً على هذه الرسالة فقط:'
    : 'Create a very concise title based only on this message:'
  ) + '\n\n' + secondUserText + '\n\n' + (language === 'ar' ? 'العنوان:' : 'Title:');

  // Build payload per provider without including any assistant/model content
  const modelId = modelSelected?.model || modelSelected?.modelId || modelSelected?.id || undefined;
  let payload;
  if (provider === 'Google') {
    payload = {
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 16 }
    };
    if (modelId) payload.model = modelId;
  } else {
    payload = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    };
  }

  let result = null;
  if (typeof generateWithAI === 'function') {
    try {
      result = await generateWithAI(payload, modelSelected);
    } catch (_) {
      result = null; // fall back to heuristic below
    }
  }

  // Local heuristic fallback when no model available or call failed
  if (!result) {
  const heur = (secondUserText || '').split(/[\n.!?]/)[0].trim();
    result = heur.slice(0, 80);
  }

  // Robust extraction of title from various shapes
  let title = result;
  if (typeof result === 'object' && result !== null) {
    title =
      result.title ||
      result.text ||
      result.output_text ||
      result.content ||
      result?.choices?.[0]?.message?.content ||
      (Array.isArray(result?.candidates)
        ? (result.candidates[0]?.content?.parts?.map(p => p?.text || '').join(' '))
        : '') ||
      '';
  }
  if (typeof title !== 'string') title = String(title ?? '');

  // Cleanup: strip emojis/punct, drop stopwords, cap length
  const stripEmojis = (s) => s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
  const stripPunct = (s) => s.replace(/[\u061F\u060C\u061B!"'`’“”«»(),.:;{}<>ـ_=+\\/-]/g, ' ');
  const normalizeSpaces = (s) => s.replace(/\s+/g, ' ').trim();

  const stopwordsAr = new Set(['من','في','على','عن','إلى','الى','و','أو','ثم','هذا','هذه','ذلك','تلك','هناك','هنا','ما','ماذا','كيف','لماذا','مع','قد','لقد','لا','لم','لن','إن','أن','كان','كانت','كانوا','هي','هو','هم','هن','كل','أي','أيضاً','ايضا','بعد','قبل','بين','بدون','غير','مثل','حول','حول']);
  const stopwordsEn = new Set(['the','a','an','and','or','of','to','for','in','on','with','about','from','by','at','as','is','are','be','was','were','this','that','these','those']);

  const isArabic = (language || 'ar').toLowerCase().startsWith('ar');
  const maxWords = 5;
  const maxChars = 48;

  let cleaned = stripEmojis(title);
  cleaned = stripPunct(cleaned);
  cleaned = normalizeSpaces(cleaned);

  const tokens = cleaned.split(' ').filter(Boolean);
  const filtered = tokens.filter(w => {
    const t = w.toLowerCase();
    return isArabic ? !stopwordsAr.has(t) : !stopwordsEn.has(t);
  });
  let compact = (filtered.length ? filtered : tokens).slice(0, maxWords).join(' ');
  compact = normalizeSpaces(compact).slice(0, maxChars).trim();
  if (!compact) compact = normalizeSpaces(title).slice(0, maxChars).trim();

  return compact || 'no title';
}
export function buildStorableResponse(response, message_id = null) {
  // Normalize provider responses (OpenAI/OpenRouter/Google) into a compact, storable record
  const now = new Date().toISOString();
  const objectType =
    response?.object ||
    (response?.choices ? 'chat.completion' : undefined) ||
    (response?.candidates ? 'generateContent' : 'response');

  // Model name if present
  const model =
    response?.model || response?.model_name || response?.candidates?.[0]?.model || '';

  // Usage tokens mapping across providers
  const usage = response?.usage || response?.usageMetadata || {};
  const usage_input_token = usage.prompt_tokens ?? usage.promptTokenCount ?? 0;
  const usage_output_token = usage.completion_tokens ?? usage.candidatesTokenCount ?? 0;
  const usage_total_token =
    usage.total_tokens ?? usage.totalTokenCount ?? (usage_input_token + usage_output_token);

  return {
    response_id: uuidv4(),
    object: objectType,
    model,
    created_at: now,
    previous_response_id: null,
    usage_input_token,
    usage_output_token,
    usage_total_token,
    user: '',
    message_id: message_id || null
  };
}

export function buildStorableRequest(request, message_id = null) {
  // Accepts either OpenAI-style payload {model, messages, temperature, ...}
  // or Google-style payload {model?, contents, generationConfig}
  const id = uuidv4();
  const model = request?.model || request?.request_model || '';
  const now = new Date().toISOString();

  let systemRole = '', systemContent = '';
  let userRole = 'user', userContent = '';

  if (Array.isArray(request?.messages)) {
    // OpenAI / OpenRouter style
    const sys = request.messages.find(m => m?.role === 'system');
    const lastUser = [...request.messages].reverse().find(m => m?.role === 'user');
    if (sys) {
      systemRole = sys.role || 'system';
      systemContent = typeof sys.content === 'string'
        ? sys.content
        : Array.isArray(sys.content)
          ? sys.content.map(p => p?.text || '').join(' ').trim()
          : '';
    }
    if (lastUser) {
      userRole = lastUser.role || 'user';
      userContent = typeof lastUser.content === 'string'
        ? lastUser.content
        : Array.isArray(lastUser.content)
          ? lastUser.content.map(p => p?.text || '').join(' ').trim()
          : '';
    }
  } else if (Array.isArray(request?.contents)) {
    // Google style
    const userEntry = request.contents.find(c => (c?.role || 'user') === 'user') || request.contents[0];
    if (userEntry) {
      userRole = userEntry.role || 'user';
      const parts = Array.isArray(userEntry.parts) ? userEntry.parts : [];
      userContent = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
    }
  }

  const gen = request?.generationConfig || request || {};
  const out = {
    request_id: id,
    request_model: model,
    request_input: userContent || '',
    request_system_role: systemRole,
    request_system_content: systemContent,
    request_user_role: userRole,
    request_user_content: userContent,
    request_min_p: gen.min_p ?? null,
    request_temperature: gen.temperature ?? null,
    request_top_p: gen.top_p ?? null,
    request_top_k: gen.top_k ?? null,
    request_max_tokens: gen.max_tokens ?? gen.maxOutputTokens ?? null,
    request_stop: Array.isArray(gen.stop) ? gen.stop.join(',') : (gen.stop || null),
    request_n: gen.n ?? 1,
    request_stream: !!gen.stream,
    repeat_penalty: gen.repeat_penalty ?? null,
    message_id: message_id || null,
    created_at: now,
    request_payload_type: Array.isArray(request?.contents) ? 'contents' : (Array.isArray(request?.messages) ? 'messages' : 'unknown'),
    request_provider: Array.isArray(request?.contents) ? 'Google' : (Array.isArray(request?.messages) ? 'OpenAI' : '')
  };
  return out;
}

export function buildStorableOutput(response, message_id = null) {
  const id = uuidv4();
  const now = new Date().toISOString();

  // helper to strip data URL prefix if present
  const stripDataUrlPrefix = (s) => {
    if (!s || typeof s !== 'string') return s;
    const idx = s.indexOf(',');
    if (s.startsWith('data:') && idx >= 0) return s.slice(idx + 1);
    return s;
  };

  // 1) Normalized result from getAIResponse: { text, raw, image? }
  if (response && typeof response === 'object' && ('text' in response || 'image' in response)) {
    const text = typeof response.text === 'string' ? response.text : '';
    const img = response.image || null;
    if (img && (img.base64 || img.url)) {
      const b64 = img.base64 ? stripDataUrlPrefix(img.base64) : null;
      return {
        output_id: id,
        output_type: b64 ? 'image' : 'text',
        output_role: 'assistant',
        output_content_type: img.mime_type || img.mime || 'image/png',
        output_content_text: text,
        output_image_base64: b64 || null,
        output_image_url: img.url || null,
        message_id: message_id || null,
        created_at: now
      };
    }
    return {
      output_id: id,
      output_type: 'text',
      output_role: 'assistant',
      output_content_type: 'text/plain',
      output_content_text: text,
      message_id: message_id || null,
      created_at: now
    };
  }

  // 2) Raw Google generateContent response (v1beta) -> response.candidates
  if (Array.isArray(response?.candidates)) {
    try {
      const content = response.candidates[0]?.content || {};
      const parts = Array.isArray(content.parts) ? content.parts : [];
      const text = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();

      // Look for inline_data / file_data or media-wrapped variants
      for (const p of parts) {
        // inline_data (snake) or inlineData (camel)
        const inline = p?.inline_data || p?.inlineData || null;
        if (inline?.data) {
          const b64 = stripDataUrlPrefix(inline.data);
          return {
            output_id: id,
            output_type: 'image',
            output_role: content.role || 'model',
            output_content_type: inline.mime_type || inline.mimeType || 'image/png',
            output_content_text: text,
            output_image_base64: b64 || null,
            output_image_url: null,
            message_id: message_id || null,
            created_at: now
          };
        }
        // file_data (snake) or fileData (camel)
        const file = p?.file_data || p?.fileData || null;
        if (file?.file_uri || file?.fileUrl) {
          return {
            output_id: id,
            output_type: 'image',
            output_role: content.role || 'model',
            output_content_type: file.mime_type || file.mimeType || 'image/png',
            output_content_text: text,
            output_image_base64: null,
            output_image_url: file.file_uri || file.fileUrl,
            message_id: message_id || null,
            created_at: now
          };
        }
        // media object/array
        const media = p?.media || null;
        if (media) {
          if (Array.isArray(media)) {
            for (const m of media) {
              const inl = m?.inline_data || m?.inlineData || null;
              if (inl?.data) {
                const b64 = stripDataUrlPrefix(inl.data);
                return {
                  output_id: id,
                  output_type: 'image',
                  output_role: content.role || 'model',
                  output_content_type: inl.mime_type || inl.mimeType || 'image/png',
                  output_content_text: text,
                  output_image_base64: b64 || null,
                  output_image_url: null,
                  message_id: message_id || null,
                  created_at: now
                };
              }
              const f = m?.file_data || m?.fileData || null;
              if (f?.file_uri || f?.fileUrl) {
                return {
                  output_id: id,
                  output_type: 'image',
                  output_role: content.role || 'model',
                  output_content_type: f.mime_type || f.mimeType || 'image/png',
                  output_content_text: text,
                  output_image_base64: null,
                  output_image_url: f.file_uri || f.fileUrl,
                  message_id: message_id || null,
                  created_at: now
                };
              }
            }
          } else {
            const inl = media.inline_data || media.inlineData || null;
            if (inl?.data) {
              const b64 = stripDataUrlPrefix(inl.data);
              return {
                output_id: id,
                output_type: 'image',
                output_role: content.role || 'model',
                output_content_type: inl.mime_type || inl.mimeType || 'image/png',
                output_content_text: text,
                output_image_base64: b64 || null,
                output_image_url: null,
                message_id: message_id || null,
                created_at: now
              };
            }
            const f = media.file_data || media.fileData || null;
            if (f?.file_uri || f?.fileUrl) {
              return {
                output_id: id,
                output_type: 'image',
                output_role: content.role || 'model',
                output_content_type: f.mime_type || f.mimeType || 'image/png',
                output_content_text: text,
                output_image_base64: null,
                output_image_url: f.file_uri || f.fileUrl,
                message_id: message_id || null,
                created_at: now
              };
            }
          }
        }
      }
      // No image found; return text
      return {
        output_id: id,
        output_type: 'text',
        output_role: content.role || 'model',
        output_content_type: 'text/plain',
        output_content_text: text,
        message_id: message_id || null,
        created_at: now
      };
    } catch (e) {
      // fallback to text-only
      return {
        output_id: id,
        output_type: 'text',
        output_role: 'model',
        output_content_type: 'text/plain',
        output_content_text: '',
        message_id: message_id || null,
        created_at: now
      };
    }
  }

  // 3) OpenAI / OpenRouter style chat completions
  if (Array.isArray(response?.choices)) {
    const msg = response.choices[0]?.message || {};
    const text = typeof msg.content === 'string' ? msg.content : '';
    // Try to detect base64 embedded image in text
    const re = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/i;
    const m = text.match ? text.match(re) : null;
    if (m) {
      const mime = m[1] || 'image/png';
      const b64 = m[2] || '';
      return {
        output_id: id,
        output_type: 'image',
        output_role: msg.role || 'assistant',
        output_content_type: mime,
        output_content_text: text.replace(re, '').trim(),
        output_image_base64: b64 || null,
        output_image_url: null,
        message_id: message_id || null,
        created_at: now
      };
    }
    return {
      output_id: id,
      output_type: 'text',
      output_role: msg.role || 'assistant',
      output_content_type: 'text/plain',
      output_content_text: text,
      message_id: message_id || null,
      created_at: now
    };
  }

  // 4) Fallback empty text
  return {
    output_id: id,
    output_type: 'text',
    output_role: 'assistant',
    output_content_type: 'text/plain',
    output_content_text: '',
    message_id: message_id || null,
    created_at: now
  };
}

export function buildStorableMessages(response, request, conversation) {
  // Returns an array of two message rows: [userMessage, aiMessage]
  const base = {
    user_id: '',
    visitor_id: '',
    metadata: {},
    vote: false
  };

  const conversation_id = conversation?.conversation_id || '';
  const now = new Date().toISOString();

  const request_id = request?.request_id || null;
  const response_id = response?.response_id || null;

  const userMessage = {
    ...base,
    message_id: uuidv4(),
    user_id: conversation?.user_id || '',
    visitor_id: conversation?.visitor_id || '',
    conversation_id,
    request_id,
    response_id: null,
    output_id: null,
    created_at: now
  };

  const aiMessage = {
    ...base,
    message_id: uuidv4(),
    user_id: conversation?.user_id || '',
    visitor_id: conversation?.visitor_id || '',
    conversation_id,
    request_id,
    response_id,
    output_id: null,
    created_at: now
  };

  return [userMessage, aiMessage];
}

export function buildStorableConversation(conversation, messages, contents, modelSelected, settings, isMixedStorage, auth) {
  // Reserved for future expansion; storable conversation can be assembled from `conversation` plus derived fields
}

// Choose the correct array (messages vs contents) for the active provider
export function pickTransportArray({ provider, messages, contents }) {
  if ((provider || '').toLowerCase() === 'google') return contents;
  return messages; // OpenAI/OpenRouter/LMS default
}

// Build UI arrays (messages/contents) from a stored bundle and infer provider
export function reconstructUIFromBundle(bundle) {
  if (!bundle) return { provider: '', model: '', messages: [], contents: [] };
  const { message_requests = [], message_outputs = [], attachments: atts = [] } = bundle;

  // Guess provider from the first request (fallbacks if no requests exist)
  const firstReq = message_requests[0] || null;
  const isGoogleReq = firstReq && ((firstReq.request_payload_type === 'contents') || ((firstReq.request_provider || '').toLowerCase() === 'google'));
  const model = (firstReq?.request_model) || '';

  // Merge events chronologically using created_at when available; also work if only one side exists
  // messages map not needed for attachment-based rehydration at the moment
  const attsByMsg = new Map();
  for (const a of (atts || [])) {
    if (!a?.message_id) continue;
    const arr = attsByMsg.get(a.message_id) || [];
    arr.push(a);
    attsByMsg.set(a.message_id, arr);
  }
  const ev = [];
  for (const r of message_requests) {
    const txt = r.request_user_content || r.request_input || '';
    if (txt) ev.push({ t: r.created_at || '', role: 'user', text: txt, mid: r.message_id });
  }
  for (const o of message_outputs) {
    const txt = o.output_content_text || '';
    const isImage = (o.output_type === 'image') && ((o.output_image_base64 && o.output_content_type) || o.output_image_url);
    const image = isImage ? {
      base64: o.output_image_base64 || null,
      mime: o.output_content_type || 'image/png',
      url: o.output_image_url || null
    } : null;
    ev.push({ t: o.created_at || '', role: 'assistant', text: txt, mid: o.message_id, image });
  }
  ev.sort((a, b) => ((a.t || '') < (b.t || '') ? -1 : (a.t === b.t ? 0 : 1)));

  // If there were Google-style requests, use contents; otherwise default to messages (OpenAI/OpenRouter)
  const isGoogle = !!isGoogleReq;
  if (isGoogle) {
    const contents = ev.map(e => {
      const base = { data: { role: e.role === 'assistant' ? 'model' : 'user', parts: [{ text: e.text }] } };
      // Attach user image (uploaded) if present via attachments store
      if (e.role === 'user') {
        const aa = attsByMsg.get(e.mid) || [];
        const img = aa.find(x => (x.type === 'image') && (x.file_base64 || x.file_url));
        if (img) {
          const fileType = img.mime_type || 'image/png';
          const dataUrl = img.file_base64 ? `data:${fileType};base64,${img.file_base64}` : (img.file_url || '');
          base.data.parts = [
            { text: e.text },
            { inline_data: { mime_type: fileType, data: '' } }
          ];
          base.filePath = dataUrl;
          base.fileType = fileType;
        }
      }
      // Attach assistant image output if present via attachments store
      if (e.role === 'assistant') {
        const aa = attsByMsg.get(e.mid) || [];
        const img = aa.find(x => (x.type === 'image') && (x.file_base64 || x.file_url));
        if (img) {
          const fileType = img.mime_type || 'image/png';
          const dataUrl = img.file_base64 ? `data:${fileType};base64,${img.file_base64}` : (img.file_url || '');
          base.data.parts = [
            { text: e.text || '' },
            { inline_data: { mime_type: fileType, data: '' } }
          ];
          base.filePath = dataUrl;
          base.fileType = fileType;
        }
      }
      return base;
    });
    return { provider: 'Google', model, messages: [], contents };
  }
  // Default/OpenAI side
  const messagesOut = ev.map(e => {
    const base = { data: { role: e.role === 'assistant' ? 'assistant' : 'user', content: e.text } };
    if (e.role === 'user') {
      const aa = attsByMsg.get(e.mid) || [];
      const img = aa.find(x => (x.type === 'image') && (x.file_base64 || x.file_url));
      if (img) {
        const fileType = img.mime_type || 'image/png';
        base.filePath = img.file_base64 ? `data:${fileType};base64,${img.file_base64}` : (img.file_url || '');
        base.fileType = fileType;
      }
    }
    if (e.role === 'assistant') {
      const aa = attsByMsg.get(e.mid) || [];
      const img = aa.find(x => (x.type === 'image') && (x.file_base64 || x.file_url));
      if (img) {
        const fileType = img.mime_type || 'image/png';
        base.filePath = img.file_base64 ? `data:${fileType};base64,${img.file_base64}` : (img.file_url || '');
        base.fileType = fileType;
      }
    }
    return base;
  });
  return { provider: 'OpenAI', model, messages: messagesOut, contents: [] };
}

// Prepare a server sync packet that mirrors the ERD (flat arrays for each table)
export function buildServerSyncPacket({ conversations = [], messages = [], message_requests = [], message_responses = [], message_outputs = [], attachments = [] } = {}) {
  return {
    conversations: Array.isArray(conversations) ? conversations : [],
    messages: Array.isArray(messages) ? messages : [],
    message_requests: Array.isArray(message_requests) ? message_requests : [],
    message_responses: Array.isArray(message_responses) ? message_responses : [],
    message_outputs: Array.isArray(message_outputs) ? message_outputs : [],
    attachments: Array.isArray(attachments) ? attachments : []
  };
}