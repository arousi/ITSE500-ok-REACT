import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {v4 as uuidv4} from 'uuid';
import {
    getUserConversationsFromServer,
    getVisitorConversationsFromServer,
    sendUserConversationsToServer,
    sendVisitorConversationsToServer
} from "./connectServer";
import logger from '../../../core/logger';
import env from '../../../config/env';

let conversations = [];
// export async function getAIResponse(text = "", file = null, modelName = "gemini-2.0-flash", auth ,settings) {
//     const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
//     console.log(file)
//
//
//     const base64filter =  file? file.base64.split(',')[1] : "";
//     console.log(base64filter)
//     try{
//            const requestData = file !== null ?{
//                 contents: [
//                     {
//                         role:"user",
//                         parts: [
//                             {
//                                 text:text
//                             },{
//                                 inline_data:{
//                                     mime_type: file.type,
//                                     data:base64filter,
//
//                                 }
//                             }
//                         ]
//
//                     }
//                 ],
//                // generationConfig:{
//                //      temperature:settings.temperature,
//                //      top_k:settings.top_k,
//                //      top_p:settings.top_p,
//                //      repeat_penalty:settings.repeat_penalty,
//                // }
//             }
//             :
//             {
//                 contents: [
//                     {
//                         parts: [
//                             {
//                                 text:text
//                             }
//                         ]
//                     }
//                 ],
//                 // generationConfig:{
//                 //     temperature:settings.temperature,
//                 //     top_k:settings.top_k,
//                 //     top_p:settings.top_p,
//                 //     repeat_penalty:settings.repeat_penalty,
//                 // }
//             };
//       const response =  await axios.post(`${endpoint}?key=${API_KEY}`, requestData, {
//            headers: {
//                'Content-Type': 'application/json'
//            }
//        })
//         if(isFirstUserMessage()){
//
//             createConversation(requestData , response , response.data.candidates[0].content , modelName , auth)
//         }
//
//
//        return response.data.candidates[0].content.parts[0].text;
//
//
//    }catch(e){
//        console.log(e)
//    }
//
//
//
//
// }

export  async function getGoogleModelsData(apiKey) {
    // If apiKey is undefined -> use env fallback. If apiKey is provided (even empty string) use it strictly.
    let GOOGLE_AI_STUDIO_API_KEY;
    if (typeof apiKey === 'undefined') {
        GOOGLE_AI_STUDIO_API_KEY = env.geminiKey || '';
    } else {
        GOOGLE_AI_STUDIO_API_KEY = apiKey || '';
    }
    if (!GOOGLE_AI_STUDIO_API_KEY) return [];
    try {
        const rsp = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_STUDIO_API_KEY}`);
        return rsp.data.models || [];
    } catch (err) {
        logger.error('models', err);
        return [];
    }
}
export async function getOpenRouterModelsData(apiKey){
    let OPEN_ROUTER_API_KEY;
    if (typeof apiKey === 'undefined') {
       // OPEN_ROUTER_API_KEY = env.openRouterKey || '';
    } else {
        OPEN_ROUTER_API_KEY = apiKey || '';
    }
    if (!OPEN_ROUTER_API_KEY) return [];
    try{
        const rsp = await axios.get(`https://openrouter.ai/api/v1/models`,{
            headers:{
                Authorization: `Bearer ${OPEN_ROUTER_API_KEY}`,
               'Content-Type': 'application/json'
            }
        });
        return rsp.data.data || [];
    }catch (err){
        logger.error('models', err);
        return [];
    }
}
export async function getOpenAIModelsData(apiKey){
    let OPENAI_API_KEY;
    if (typeof apiKey === 'undefined') {
        OPENAI_API_KEY = env.openAiKey || '';
    } else {
        OPENAI_API_KEY = apiKey || '';
    }
    if (!OPENAI_API_KEY) return [];
    try{
        const rsp = await axios.get(`https://api.openai.com/v1/models` , {
            headers:{
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return rsp.data.data || [];
    }catch (err){
        logger.error('models', err);
        return [];
    }
}
// Phase 1: HuggingFace models discovery via curated list (no inference yet)
export async function getHuggingFaceModelsData(apiKey){
    const HF_API_KEY = (typeof apiKey === 'undefined') ? (env.huggingFaceKey || '') : (apiKey || '');
    if (!HF_API_KEY) return [];
    const curated = [
        { id: 'mistralai/Mistral-7B-Instruct-v0.3' },
        { id: 'meta-llama/Llama-3.1-8B-Instruct' },
        { id: 'google/gemma-2-9b-it' },
        { id: 'sentence-transformers/all-MiniLM-L6-v2' },
        { id: 'nlpconnect/vit-gpt2-image-captioning' },
        { id: 'Salesforce/blip-image-captioning-base' }
    ];
    return curated;
}
export async function getAllModelsData(keys = {}){
    try{
      // If a keys object is passed from the UI, treat missing provider keys as intentional (don't fallback to env).
      const usingUIKeys = keys && Object.keys(keys).length > 0;
      const googleKeyToPass = usingUIKeys ? (keys?.google?.key || '') : undefined;
      const openRouterKeyToPass = usingUIKeys ? (keys?.openrouter?.key || '') : undefined;
      const openAIKeyToPass = usingUIKeys ? (keys?.openai?.key || '') : undefined;

      const [googleModels , openRouterModels , openAIModels, hfModels] = await Promise.all([
          getGoogleModelsData(googleKeyToPass),
          getOpenRouterModelsData(openRouterKeyToPass),
          getOpenAIModelsData(openAIKeyToPass),
          getHuggingFaceModelsData(usingUIKeys ? (keys?.huggingface?.key || '') : undefined)
      ]);
        function detectCategories(name = ''){
            const n = (name||'').toLowerCase();
            const cats = new Set();
            if(/chat|gpt|assistant|dialog|conversation|chat/ig.test(n)) cats.add('Chat');
            if(/image|vision|vision|img|clip|dall|stable|sd|imagegen|render/ig.test(n)) cats.add('Vision');
            if(/embed|embedding|vector/ig.test(n)) cats.add('Embeddings');
            if(/imagegen|img|dalle|stable|sd|-img|generateimage/ig.test(n)) cats.add('ImageGen');
            if(/audio|tts|speech|wav|mp3/ig.test(n)) cats.add('Audio/TTS');
            if(/in-|input|text-in|textinput|text_input|textin/ig.test(n)) cats.add('Text In');
            if(/image-in|image_input|imagein/ig.test(n)) cats.add('Image In');
            if(/audio-in|audio_input|audioin/ig.test(n)) cats.add('Audio In');
            if(/out-|output|text-out|textoutput|textout/ig.test(n)) cats.add('Text Out');
            if(/image-out|imageoutput|imageout/ig.test(n)) cats.add('Image Out');
            if(/audio-out|audiooutput|audioout/ig.test(n)) cats.add('Audio Out');
            if(cats.size === 0) cats.add('Chat'); // default fallback
            return Array.from(cats);
        }

        const googleFormatted = googleModels.map((model) => ({
            name: model.name,
            provider: "Google",
            categories: detectCategories(model.name)
        }));

        const openRouterFormatted = openRouterModels.map((model) => ({
            name: model.id,
            provider: "OpenRouter",
            categories: detectCategories(model.id)
        }));

        const openAIFormatted = openAIModels.map((model) => ({
            name: model.id,
            provider: "OpenAI",
            categories: detectCategories(model.id)
        }))
        const hfFormatted = (hfModels || []).map((model) => ({
            name: model.id,
            provider: "HuggingFace",
            categories: detectCategories(model.id)
        }));
    // debug logs removed or left intentionally empty
        return [...googleFormatted , ...openRouterFormatted , ...openAIFormatted, ...hfFormatted];
    }catch(err){
        logger.error('models', err);
        return [];
    }
}
export function mapProviderToKey(providerName){
    if (!providerName) return '';
    const p = providerName.toString().toLowerCase().trim();
    if (p === 'google' || p === 'google_ai_studio' || p.includes('google')) return 'google';
    if (p === 'openrouter' || p === 'open_router' || p.includes('openrouter')) return 'openrouter';
    if (p === 'openai' || p === 'open_ai' || p.includes('openai')) return 'openai';
    if (p === 'huggingface' || p === 'hugging_face' || p.includes('hugging')) return 'huggingface';
    if (p === 'lmstudio' || p === 'lm_studio' || p.includes('lm studio')) return 'lmstudio';
    return '';
}
export async function createConversation(request , response , output , modelName , auth ){
    const newMessages = {
        message_id: uuidv4(),
        vote: false,
        img: null,
        metadata: {},
        embedding: {},
        doc: null,
        request: {
            id: uuidv4(),
            request_model: modelName,
            request_messages_user_role: "user",
            request_messages_user_content: request.contents[0].parts[0].text,
        },
        response: {
            id: uuidv4(),
            response_id: `${response.data.responseId}`,
            model: response.data.modelVersion,
            status: "completed",
        },
        output: {
            id: uuidv4(),
            output_type: "text",
            output_content_text: output.parts[0].text
        }
    };
    conversations.messages.push(newMessages);
    if (auth.data) {
        if (auth.data.user_id) {
            const resp = await sendUserConversationsToServer(conversations, auth);
            logger.debug('sync', resp);
            const result = getUserConversationsFromServer(auth);
            logger.debug('sync', result);
        } else {
            const resp = sendVisitorConversationsToServer(conversations, auth);
            logger.debug('sync', resp);
            const result = getVisitorConversationsFromServer(auth);
            logger.debug('sync', result);
        }
    }
}
// helper removed; keep logic inline where needed

export async function switchBetweenProviders(modelSelected, messages  , contents  , settings ,signal, apiKeys = {}){
     // Always return { text: string|null, raw: object|null, image?: { base64?: string, mime_type?: string, url?: string } }
     let result = { text: '', raw: null };
     // Try-parse JSON helper for structured output
     const tryParseJSON = (s) => {
         try {
             if (!s) return null;
             if (typeof s === 'object') return s;
             const o = JSON.parse(s);
             return (o && typeof o === 'object') ? o : null;
         } catch (_) { return null; }
     };
     // Resolve structured output schema from global settings
     const schemaObj = settings?.structured_output_enabled ? tryParseJSON(settings?.structured_output_schema) : null;
     // Small helper to grab the last user text prompt from Google contents or OpenAI messages
     const getLastUserText = ({ msgs = [], cts = [] } = {}) => {
         // OpenAI-style
         const lastMsg = [...(msgs||[])].reverse().find(m => (m?.role||'') === 'user');
         if (lastMsg) {
             const c = lastMsg.content;
             if (typeof c === 'string') return c;
             if (Array.isArray(c)) return c.map(p=>p?.text||'').filter(Boolean).join(' ').trim();
         }
         // Google-style
         const lastC = [...(cts||[])].reverse().find(c => (c?.role||'') === 'user');
         if (lastC) {
             const parts = Array.isArray(lastC.parts) ? lastC.parts : [];
             return parts.map(p=>p?.text||'').filter(Boolean).join(' ').trim();
         }
         return '';
     };
     // Helper: extract first embedded data URL image from markdown/text
     const extractImageFromText = (t = '') => {
         try {
             const re = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/i;
             const m = (t || '').match(re);
             if (m) return { base64: m[2], mime_type: m[1] };
         } catch (_) {}
         return null;
     };
     // Normalize data URLs to raw base64
     const stripDataUrl = (s) => {
         if (typeof s !== 'string') return '';
         if (s.startsWith('data:')) {
             const i = s.indexOf(',');
             return i >= 0 ? s.slice(i + 1) : '';
         }
         return s;
     };
     // Sanitize Google contents before sending:
     // - Keep all text.
     // - Drop any assistant/model inline images (they're outputs, not inputs).
     // - Keep at most the last user image.
     // - Normalize inline data keys for SDK (camelCase) or REST (snake_case).
     const sanitizeGoogleContents = (arr = [], { style = 'sdk' } = {}) => {
         const out = [];
         if (!Array.isArray(arr)) return out;
         // Only allow an image if it's on the final user turn being sent now.
         const lastIndex = arr.length - 1;
         for (let i = 0; i < arr.length; i++) {
             const c = arr[i] || {};
             const role = c.role || 'user';
             const parts = Array.isArray(c.parts) ? c.parts : [];
             const allowImg = (role.toLowerCase() === 'user' && i === lastIndex);
             let usedImg = false;
             const newParts = [];
             for (const p of parts) {
                 if (typeof p?.text === 'string' && p.text.trim()) newParts.push({ text: p.text });
                 if (!allowImg) continue;
                 if (usedImg) continue;
                 // inline_data (snake)
                 if (p?.inline_data) {
                     const mime = p.inline_data.mime_type || p.inline_data.mimeType || 'image/png';
                     const data = stripDataUrl(p.inline_data.data || '');
                     if (data) {
                         newParts.push(style === 'sdk' ? { inlineData: { mimeType: mime, data } } : { inline_data: { mime_type: mime, data } });
                         usedImg = true; continue;
                     }
                 }
                 // inlineData (camel)
                 if (p?.inlineData) {
                     const mime = p.inlineData.mimeType || p.inlineData.mime_type || 'image/png';
                     const data = stripDataUrl(p.inlineData.data || '');
                     if (data) {
                         newParts.push(style === 'sdk' ? { inlineData: { mimeType: mime, data } } : { inline_data: { mime_type: mime, data } });
                         usedImg = true; continue;
                     }
                 }
                 // file_data (snake) with URI
                 if (p?.file_data && (p.file_data.file_uri || p.file_data.fileUrl)) {
                     const mime = p.file_data.mime_type || p.file_data.mimeType || 'image/png';
                     const file_uri = p.file_data.file_uri || p.file_data.fileUrl;
                     newParts.push(style === 'sdk' ? { fileData: { mimeType: mime, fileUri: file_uri } } : { file_data: { mime_type: mime, file_uri } });
                     usedImg = true; continue;
                 }
                 // fileData (camel)
                 if (p?.fileData && (p.fileData.fileUri || p.fileData.file_uri)) {
                     const mime = p.fileData.mimeType || p.fileData.mime_type || 'image/png';
                     const fileUri = p.fileData.fileUri || p.fileData.file_uri;
                     newParts.push(style === 'sdk' ? { fileData: { mimeType: mime, fileUri } } : { file_data: { mime_type: mime, file_uri: fileUri } });
                     usedImg = true; continue;
                 }
             }
             // Skip empty turns (e.g., prior assistant images removed with no text)
             if (newParts.length > 0) {
                 out.push({ role, parts: newParts });
             }
         }
         return out;
     };
     const provider = modelSelected?.provider;
     switch(provider){
        case "OpenRouter":{
            try{
                const orKey = (apiKeys?.openrouter?.key || env.openRouterKey || '').trim();
                // Use a dev proxy on localhost to avoid browser CORS issues
                const isLocal = (typeof window !== 'undefined') && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
                const orEndpoint = isLocal ? '/openrouter/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
                const body = {
                    model: modelSelected.name,
                    messages,
                    temperature: settings.temperature ?? undefined,
                    top_k: settings.top_k ?? undefined,
                    top_p: settings.top_p ?? undefined,
                    min_p: settings.min_p ?? undefined,
                    repeat_penalty: settings.repeat_penalty ?? undefined,
                };
                if (settings?.limit_response_length && Number(settings?.max_tokens) > 0) {
                    body.max_tokens = Number(settings.max_tokens);
                }
                if (schemaObj) {
                    body.response_format = {
                        type: 'json_schema',
                        json_schema: { name: 'Result', schema: schemaObj }
                    };
                }
                // Minimal-but-sufficient headers for OpenRouter (app/personal keys)
                const baseHeaders = {
                    Authorization: `Bearer ${orKey}`,
                    'Content-Type': 'application/json',
                    ...(typeof window !== 'undefined' ? { 'HTTP-Referer': window.location.origin, 'X-Title': document?.title || 'Ozma Kapa Chat' } : {}),
                };
                // Attach optional user id header if we can extract a stable id
                let headers = { ...baseHeaders };
                try {
                    if (typeof localStorage !== 'undefined') {
                        const raw = localStorage.getItem('auth');
                        if (raw) {
                            const a = JSON.parse(raw);
                            const endUserId = a?.data?.user_id || a?.user_id || a?.data?.anon_id || a?.anon_id || a?.visitor_id || '';
                            if (endUserId) headers['X-User-Id'] = String(endUserId);
                        }
                    }
                } catch (_) { /* ignore */ }

                let response;
                try {
                    response = await axios.post(orEndpoint, body, { headers, signal });
                } catch (e1) {
                    const status = e1?.response?.status;
                    const dataMsg = e1?.response?.data?.error?.message || e1?.response?.data?.message || '';
                    const hasUserId = !!headers['X-User-Id'];
                    const isUserNotFound = status === 401 && /user\s*not\s*found/i.test(dataMsg || e1?.message || '');
                    // Some app configurations reject unknown X-User-Id; retry once without it
                    if (hasUserId && isUserNotFound) {
                        const retryHeaders = { ...headers };
                        delete retryHeaders['X-User-Id'];
                        response = await axios.post(orEndpoint, body, { headers: retryHeaders, signal });
                    } else {
                        throw e1;
                    }
                }
                const text = response?.data?.choices?.[0]?.message?.content || '';
                const embedded = extractImageFromText(text);
                result = embedded ? { text, raw: response?.data || null, image: embedded } : { text, raw: response?.data || null };
            }catch(err){
         const status = err?.response?.status;
         const data = err?.response?.data;
         const isNetwork = !status && (err?.code === 'ERR_NETWORK' || !err?.response);
         const msg = isNetwork ? 'Network Error (CORS/preflight or connectivity)' : (data?.error?.message || data?.message || err?.message || 'Unknown error');
         const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
         console.error(`[OpenRouter] HTTP ${status || 'ERR'} at /chat/completions:`, detail);
         throw new Error(`OpenRouter: HTTP ${status || 'ERR'} - ${msg}`);
            }
            break;
        }
        case "Google":{
             try{
                 const googleKey = (apiKeys?.google?.key || env.geminiKey || '').trim();
                 const rawName = (modelSelected?.name || 'models/gemini-1.5-flash');
                 const modelId = rawName.replace(/^models\//, '');
                 const genAI = new GoogleGenerativeAI(googleKey);
                 const model = genAI.getGenerativeModel({ model: modelId });
                 // Conservative detection of models that can RETURN images (not just accept them)
                 const isImageModel = /imagen|image(?:gen|\b)|flash-image|image-generative|2\.0(?:-flash)?|2\.5(?:-flash)?|imagegen/i.test(modelId);
                 let sdkResp;
                 // Prefer passing the original contents payload when available for maximum fidelity,
                 // but sanitize it to remove assistant images and normalize inline data.
                 const sdkContentsBase = sanitizeGoogleContents(contents, { style: 'sdk' });
                 // Heuristic: if the last user message implies image generation/edit, strongly request an image output
                 const lastUserText = getLastUserText({ cts: contents }) || '';
                 const imageIntent = /(?:\bimage\b|\bpicture\b|draw|render|generate|create|photo|art|صورة|ارسم|ارسم\s|صمم|صورةً|أنشئ|انشئ|ولّد|توليد|لوّن|لون|اجعلها|غيّر\s?اللون|بدّل\s?اللون)/i.test(lastUserText);
                 const sdkContents = (() => {
                     if (!imageIntent) return sdkContentsBase;
                     const clone = Array.isArray(sdkContentsBase) ? sdkContentsBase.map(c => ({ role: c.role, parts: [...(c.parts||[])] })) : [];
                     if (clone.length > 0) {
                         const last = clone[clone.length - 1];
                         if (last && Array.isArray(last.parts)) {
                             last.parts.push({ text: 'أنت نموذج قادر على توليد الصور. أعد صورة (inlineData) تلبي التعليمات السابقة، ومعها وصف نصي موجز. لا تكتفِ بإرشادات نصية فقط.' });
                         }
                     }
                     return clone;
                 })();
                 //Google: HTTP 400 - Invalid JSON payload received. Unknown name "minP" at 'generation_config': Cannot find field.
                 // Build generationConfig safely: only ask for IMAGE when we intend it AND model likely supports it
                const generationConfig = {
                    temperature: settings.temperature,
                    topP: settings.top_p,
                    topK: settings.top_k
                };
                if (settings?.limit_response_length && Number(settings?.max_tokens) > 0) {
                    generationConfig.maxOutputTokens = Number(settings.max_tokens);
                }
                 // Apply structured output only for non-image intents
                 if (!imageIntent && schemaObj) {
                     generationConfig.responseMimeType = 'application/json';
                     generationConfig.responseSchema = schemaObj;
                 }
                 if (imageIntent && isImageModel) {
                     generationConfig.responseModalities = ["IMAGE", "TEXT"];
                 }
                 const payload = { contents: sdkContents, generationConfig };
                 sdkResp = await model.generateContent(payload);
                 const resp = sdkResp?.response;
                 // SDK convenience: resp.text() may return the combined text
                 let text = '';
                 try { text = (await resp?.text()) || ''; } catch(_) {}
                 // Fallback parse parts for text and potential inline image
                 const parts = Array.isArray(resp?.candidates?.[0]?.content?.parts) ? resp.candidates[0].content.parts : [];
                 // Log all parts for debugging
                 logger.debug('gemini', 'response parts', parts);
                 if (!text) {
                     text = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                 }
                 let image = null;
                 // Improved: Try to extract image from all possible locations
                 for (const p of parts) {
                     // Direct inlineData or fileData (camel/snake)
                     const inline = p.inlineData || p.inline_data || null;
                     const fileData = p.fileData || p.file_data || null;
                     if (inline?.data) {
                         image = { base64: inline.data, mime_type: inline.mimeType || inline.mime_type || 'image/png' };
                         break;
                     }
                     if (fileData?.file_uri || fileData?.fileUrl) {
                         image = { url: fileData.file_uri || fileData.fileUrl, mime_type: fileData.mimeType || fileData.mime_type || 'image/png' };
                         break;
                     }
                     // Check media object/array
                     const m = p.media;
                     if (m) {
                         if (!Array.isArray(m)) {
                             const minl = m.inlineData || m.inline_data || null;
                             const mfdata = m.fileData || m.file_data || null;
                             if (minl?.data) {
                                 image = { base64: minl.data, mime_type: minl.mimeType || minl.mime_type || 'image/png' };
                                 break;
                             }
                             if (mfdata?.file_uri || mfdata?.fileUrl) {
                                 image = { url: mfdata.file_uri || mfdata.fileUrl, mime_type: mfdata.mimeType || mfdata.mime_type || 'image/png' };
                                 break;
                             }
                         } else {
                             for (const mm of m) {
                                 const minl = mm.inlineData || mm.inline_data || null;
                                 const mfdata = mm.fileData || mm.file_data || null;
                                 if (minl?.data) {
                                     image = { base64: minl.data, mime_type: minl.mimeType || minl.mime_type || 'image/png' };
                                     break;
                                 }
                                 if (mfdata?.file_uri || mfdata?.fileUrl) {
                                     image = { url: mfdata.file_uri || mfdata.fileUrl, mime_type: mfdata.mimeType || mfdata.mime_type || 'image/png' };
                                     break;
                                 }
                             }
                         }
                     }
                 }
                 // Also try to extract embedded data URL images from text
                if (!image) {
                     const embedded = extractImageFromText(text);
                     if (embedded) image = embedded;
                     // lightweight debug: log parts once if no image found
                     if (!image) {
                         try { logger.debug('gemini', 'no inline image', parts); } catch(_) {}
                     }
                 }
                // If the prompt asked for an image but none returned, attempt a forced IMAGE-only retry via REST
                if (!image && imageIntent && isImageModel) {
                    try {
                        const restContents = sanitizeGoogleContents([...contents, { role: 'user', parts: [{ text: 'أعد صورة (inline_data) فقط لهذه التعليمات، مع وصف قصير.' }] }], { style: 'rest' });
                        const restModelPath = rawName.startsWith('models/') ? rawName : `models/${rawName}`;
                        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${restModelPath}:generateContent?key=${googleKey}`,
                            {
                                contents: restContents,
                                generationConfig: { temperature: settings.temperature, topP: settings.top_p, topK: settings.top_k, responseModalities: ["IMAGE", "TEXT"] }
                            },
                            { headers: { 'Content-Type': 'application/json' }, signal }
                        );
                        const rparts = response?.data?.candidates?.[0]?.content?.parts || [];
                        const imgP = rparts.find(p => p?.inline_data || p?.file_data || p?.inlineData || p?.fileData || p?.media?.inline_data || p?.media?.inlineData || p?.media?.file_data || p?.media?.fileData) || {};
                        const inl = imgP.inline_data || imgP.inlineData || imgP.media?.inline_data || imgP.media?.inlineData || null;
                        const fdt = imgP.file_data || imgP.fileData || imgP.media?.file_data || imgP.media?.fileData || null;
                        if (inl?.data) {
                            image = { base64: inl.data, mime_type: inl.mime_type || inl.mimeType || 'image/png' };
                        } else if (fdt?.file_uri || fdt?.fileUrl) {
                            image = { url: fdt.file_uri || fdt.fileUrl, mime_type: fdt.mime_type || fdt.mimeType || 'image/png' };
                        }
                        // add any extra text
                        const t2 = rparts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                        if (t2) text = text ? `${text}\n${t2}` : t2;
                    } catch (_) { /* ignore forced retry errors */ }
                }
                 // If explicitly image model and no inline image found, try fallback REST (rare edge)
           if (!image && isImageModel && imageIntent) {
                     try{
                        const restContents = sanitizeGoogleContents(contents, { style: 'rest' });
               const restModelPath = rawName.startsWith('models/') ? rawName : `models/${rawName}`;
               const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${restModelPath}:generateContent?key=${googleKey}`,
                            {
                                contents: restContents,
                                generationConfig: { temperature: settings.temperature, topP: settings.top_p, topK: settings.top_k }
                            },
                             { headers:{ 'Content-Type': 'application/json' }, signal }
                         );
                        const rparts = response?.data?.candidates?.[0]?.content?.parts || [];
                        const inl = rparts.find(p => {
                            if (p?.inline_data || p?.file_data) return true;
                            const m = p?.media;
                            if (!m) return false;
                            if (Array.isArray(m)) return m.some(x => x?.inline_data || x?.file_data || x?.inlineData || x?.fileData);
                            return !!(m?.inline_data || m?.file_data || m?.inlineData || m?.fileData);
                        });
                        const media = inl?.media || null;
                        const inlinePart = (inl?.inline_data || inl?.inlineData || (Array.isArray(media) ? (media.find(x=>x?.inline_data||x?.inlineData)?.inline_data || media.find(x=>x?.inlineData)?.inlineData) : (media?.inline_data || media?.inlineData)) || null);
                        const filePart = (inl?.file_data || inl?.fileData || (Array.isArray(media) ? (media.find(x=>x?.file_data||x?.fileData)?.file_data || media.find(x=>x?.fileData)?.fileData) : (media?.file_data || media?.fileData)) || null);
                        if (inlinePart?.data) {
                            image = { base64: inlinePart.data, mime_type: inlinePart.mime_type || inlinePart.mimeType || 'image/png' };
                        } else if (filePart?.file_uri || filePart?.fileUri) {
                            image = { url: filePart.file_uri || filePart.fileUri, mime_type: filePart.mime_type || filePart.mimeType || 'image/png' };
                        }
                     }catch(_){}
                 }
                 if (image && (!text || !text.trim())) {
                     // Produce a very short caption using a text-capable model (fallback)
                     try {
                         const captionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                         const prompt = getLastUserText({ cts: contents }) || 'صف الصورة الناتجة بجملة واحدة.';
                         const capResp = await captionModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `اكتب وصفاً موجزاً (جملة واحدة) للصورة المطلوب توليدها بالنص التالي:
${prompt}` }] }] });
                         const capText = await capResp?.response?.text();
                         text = (capText || '').trim();
                     } catch (_) { /* ignore caption errors */ }
                 }
                 result = image ? { text, raw: resp || null, image } : { text, raw: resp || null };
            }catch(err){
                 // Fallback to REST if SDK path fails
                 try{
                     const googleKey = (apiKeys?.google?.key || env.geminiKey || '').trim();
                     const rawModelName = (modelSelected?.name || 'gemini-1.5-flash');
                     const modelPath = rawModelName.startsWith('models/') ? rawModelName : `models/${rawModelName}`;
                     const restContents = sanitizeGoogleContents(contents, { style: 'rest' });
                     const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;
                     // Respect text-only models: add IMAGE modality only when needed
                     const lastUserText = getLastUserText({ cts: contents }) || '';
                     const imgIntent = /(?:\bimage\b|\bpicture\b|draw|render|generate|create|photo|art|صورة|ارسم|ارسم\s|صمم|صورةً|أنشئ|انشئ|ولّد|توليد|لوّن|لون|اجعلها|غيّر\s?اللون|بدّل\s?اللون)/i.test(lastUserText);
                     const genCfg = { temperature: settings.temperature, topP: settings.top_p, topK: settings.top_k };
                     if (settings?.limit_response_length && Number(settings?.max_tokens) > 0) {
                         genCfg.maxOutputTokens = Number(settings.max_tokens);
                     }
                     if (!imgIntent && schemaObj) {
                         genCfg.responseMimeType = 'application/json';
                         genCfg.responseSchema = schemaObj;
                     }
                     if (imgIntent) genCfg.responseModalities = ["IMAGE", "TEXT"];
                     const response = await axios.post(
                         `${endpoint}?key=${googleKey}`,
                         { contents: restContents, generationConfig: genCfg },
                         { headers:{ 'Content-Type': 'application/json' }, signal }
                     );
                     const parts = response?.data?.candidates?.[0]?.content?.parts || [];
                     const text = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                     let image = null;
                     const inl = parts.find(p => p?.inline_data || p?.file_data);
                     if (inl?.inline_data?.data) {
                         image = { base64: inl.inline_data.data, mime_type: inl.inline_data.mime_type || 'image/png' };
                     } else if (inl?.file_data?.file_uri) {
                         image = { url: inl.file_data.file_uri, mime_type: inl.file_data.mime_type || 'image/png' };
                     }
                     if (!image) {
                         const embedded = extractImageFromText(text);
                         if (embedded) image = embedded;
                         if (!image) {
                             try { logger.debug('gemini', 'no inline image (REST)', parts); } catch(_) {}
                         }
                     }
                     result = image ? { text, raw: response?.data || null, image } : { text, raw: response?.data || null };
                }catch(e2){
                    // If API complains the model only supports text output, retry with TEXT-only
                    try {
                        const msg = e2?.response?.data?.error?.message || e2?.message || '';
                        if (/only supports text output|text\s*only/i.test(msg)) {
                            const googleKey = (apiKeys?.google?.key || env.geminiKey || '').trim();
                            const rawModelName = (modelSelected?.name || 'gemini-1.5-flash');
                            const modelPath = rawModelName.startsWith('models/') ? rawModelName : `models/${rawModelName}`;
                            const restContents = sanitizeGoogleContents(contents, { style: 'rest' });
                            const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;
                            const response = await axios.post(
                                `${endpoint}?key=${googleKey}`,
                                { contents: restContents, generationConfig: { temperature: settings.temperature, topP: settings.top_p, topK: settings.top_k, responseModalities: ["TEXT"] } },
                                { headers:{ 'Content-Type': 'application/json' }, signal }
                            );
                            const parts = response?.data?.candidates?.[0]?.content?.parts || [];
                            const text = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                            result = { text, raw: response?.data || null };
                            break;
                        }
                    } catch(_) { /* ignore */ }
                    const status = e2?.response?.status;
                    const data = e2?.response?.data;
                    const msg = data?.error?.message || data?.message || e2?.message || 'Unknown error';
                    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
                    console.error(`[Google REST] HTTP ${status || 'ERR'} at :generateContent fallback:`, detail);
                    // Prefer surfacing the REST error since that is the final attempt
                    throw new Error(`Google: HTTP ${status || 'ERR'} - ${msg}`);
                 }
             }
             break;
         }
    case "OpenAI":{
            try{
                const oaKey = (apiKeys?.openai?.key || env.openAiKey || '').trim();
                const name = modelSelected?.name?.toLowerCase() || '';
                const likelyImageModel = /dall|image|gpt-image/.test(name);
                if (likelyImageModel) {
                    // Generate image using Images API; prompt = last user text
                    const lastUser = [...(messages||[])].reverse().find(m => m?.role === 'user');
                    const prompt = typeof lastUser?.content === 'string' ? lastUser.content : Array.isArray(lastUser?.content) ? lastUser.content.map(p => p?.text || '').join(' ').trim() : '';
                    const response = await axios.post(`https://api.openai.com/v1/images/generations`, {
                        model: modelSelected.name,
                        prompt,
                        response_format: 'b64_json'
                    }, {
                        headers: { Authorization: `Bearer ${oaKey}`, 'Content-Type': 'application/json' },
                        signal
                    });
                    const b64 = response?.data?.data?.[0]?.b64_json || '';
                    // Try to add a brief caption with a cheap chat call
                    let caption = '';
                    try {
                        const chat = await axios.post(`https://api.openai.com/v1/chat/completions`, {
                            model: 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: 'You write a single short caption (one sentence) for an image prompt.' },
                                { role: 'user', content: `Write a concise caption for an image generated from: ${prompt}` }
                            ],
                            temperature: 0.3
                        }, { headers: { Authorization: `Bearer ${oaKey}`, 'Content-Type': 'application/json' }, signal });
                        caption = chat?.data?.choices?.[0]?.message?.content || '';
                    } catch (_) { /* ignore */ }
                    result = { text: caption, raw: response?.data || null, image: { base64: b64, mime_type: 'image/png' } };
                } else {
                    const endpoint = `https://api.openai.com/v1/chat/completions`;
                    const body = {
                        model:modelSelected.name,
                        messages,
                        temperature:settings.temperature,
                        top_p: settings.top_p,
                    };
                    if (settings?.limit_response_length && Number(settings?.max_tokens) > 0) {
                        body.max_tokens = Number(settings.max_tokens);
                    }
                    if (schemaObj) {
                        body.response_format = {
                            type: 'json_schema',
                            json_schema: { name: 'Result', schema: schemaObj }
                        };
                    }
                    const response = await axios.post(endpoint, body, {
                        headers: { Authorization: `Bearer ${oaKey}`, 'Content-Type': 'application/json' },
                        signal
                    });
                    const text = response?.data?.choices?.[0]?.message?.content || '';
                    const embedded = extractImageFromText(text);
                    result = embedded ? { text, raw: response?.data || null, image: embedded } : { text, raw: response?.data || null };
                }
            }catch(err){
                const status = err?.response?.status;
                const data = err?.response?.data;
                const msg = data?.error?.message || data?.message || err?.message || 'Unknown error';
                const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
                console.error(`[OpenAI] HTTP ${status || 'ERR'} at /chat/completions:`, detail);
                throw new Error(`OpenAI: HTTP ${status || 'ERR'} - ${msg}`);
            }
            break;
        }
         default: {
             result = { text: '', raw: null };
         }
     }
     return result;
}
export async function  getAIResponse(updatedMessages , updatedContents , settings  , file=null , modelSelected , signal, apiKeys = {}){
    let filteredMessages = [];
    let filteredContents = [];

    for(let msg of updatedMessages){
         filteredMessages.push(msg.data);
    }
    for(let msg of updatedContents){
         filteredContents.push(msg.data);
    }

    // Inject a system prompt once at the start if enabled and not already present
    try {
        if (settings?.system_prompt_enabled && (settings?.system_prompt || '').trim()) {
            const provider = (modelSelected?.provider || '').toLowerCase();
            const sysText = (settings.system_prompt || '').trim();
            if (provider === 'google') {
                const hasSystemLike = (filteredContents || []).some(c => (c?.role || '').toLowerCase() === 'system');
                if (!hasSystemLike) {
                    filteredContents = [{ role: 'user', parts: [{ text: sysText }] }, ...filteredContents];
                }
            } else {
                const hasSystem = (filteredMessages || []).some(m => (m?.role || '').toLowerCase() === 'system');
                if (!hasSystem) {
                    filteredMessages = [{ role: 'system', content: sysText }, ...filteredMessages];
                }
            }
        }
    } catch(_) { /* ignore injection issues */ }

    // Let errors bubble up to the caller (ChatField) to handle gracefully
    return await switchBetweenProviders(
        modelSelected,
        filteredMessages,
        filteredContents,
        settings,
        signal,
        apiKeys
    );
}