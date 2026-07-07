import axios from 'axios'
import logger from '../../../core/logger'
import env from '../../../config/env'

const BASE_URL = env.apiBaseUrl;
const UNIFIED_URL = `${BASE_URL}/api/v1/user_mang/me/`;

// Simple sequential queue to avoid concurrent syncs causing mixed storage races
let q = Promise.resolve();
const enqueue = (fn) => {
    q = q.then(fn).catch((e) => { logger.error('unified-sync', 'error in queued task', e); });
    return q;
};

function getDeviceId() {
    try {
        const key = 'device_id';
        let v = localStorage.getItem(key);
        if (!v) { v = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); localStorage.setItem(key, v); }
        return v;
    } catch (_) { return undefined; }
}

function buildHeaders(auth) {
    const h = { 'Content-Type': 'application/json' };
    const token = auth?.data?.access_token || auth?.access_token;
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

// Send a full ERD-style packet using UnifiedSyncView
export function sendUserConversationsToServer(packet, auth) {
    const body = {
        chat: true,
        profile: false,
        conversations: packet?.conversations || [],
        messages: packet?.messages || [],
        message_requests: packet?.message_requests || [],
        message_responses: packet?.message_responses || [],
        message_outputs: packet?.message_outputs || [],
        attachment: packet?.attachments || [],
        user_id: auth?.data?.user_id || auth?.data?.id || undefined,
        device_id: getDeviceId(),
    };//${base}/api/v1/user_mang/me/?user_id=${action.payload.auth.data.user_id}&profile=true&chat=false
    return enqueue(() => axios.post(`${UNIFIED_URL}?user_id=${auth?.data?.user_id}&profile=false&chat=true`, body, { headers: buildHeaders(auth) })
        .then((res) => res?.data)
    );
}

export function getUserConversationsFromServer(auth) {
    const userId = auth?.data?.user_id || auth?.data?.id;
    const anonId = auth?.data?.anon_id || (typeof localStorage !== 'undefined' && localStorage.getItem('visitor_id')) || '';
    const tempId = auth?.data?.temp_id || '';
    const qp = new URLSearchParams();
    qp.set('chat', 'true');
    qp.set('profile', 'false');
    if (userId) qp.set('user_id', userId);
    else if (anonId) qp.set('anon_id', anonId);
    else if (tempId) {
        qp.set('temp_id', tempId);
        const did = getDeviceId();
        if (did) qp.set('device_id', did);
    }
    const url = `${UNIFIED_URL}?${qp.toString()}`;
    // GET conversations with Authorization when available
    return enqueue(() => axios.get(url, { headers: buildHeaders(auth) })
        .then((res) => res?.data)
    );
}

// Keep API, but route to UnifiedSyncView (upsert one conversation if provided)
export function updateConversation(conversation, auth) {
    const body = {
    chat: true,
    profile: false,
        conversations: conversation ? [conversation] : [],
        messages: [],
        message_requests: [],
        message_responses: [],
    message_outputs: [],
    attachments: [],
        user_id: auth?.data?.user_id || undefined,
        device_id: getDeviceId(),
    };
    return enqueue(() => axios.post(UNIFIED_URL, body, { headers: buildHeaders(auth) }).then(r => r?.data));
}

export function sendVisitorConversationsToServer(packetOrConversations, auth) {
    // Backward-compatible: allow passing just conversations array, or full packet object
    const packet = Array.isArray(packetOrConversations)
        ? { conversations: packetOrConversations }
        : (packetOrConversations || {});
    const body = {
        chat: true,
        profile: false,
        conversations: packet?.conversations || [],
        messages: packet?.messages || [],
        message_requests: packet?.message_requests || [],
        message_responses: packet?.message_responses || [],
        message_outputs: packet?.message_outputs || [],
        attachment: packet?.attachments || [],
        anon_id: auth?.data?.anon_id || undefined,
        temp_id: auth?.data?.temp_id || undefined,
        device_id: getDeviceId(),
    };
    return enqueue(() => axios.post(UNIFIED_URL, body, { headers: buildHeaders(auth) }).then(r => r?.data));
}

export function getVisitorConversationsFromServer(auth) {
    const anon = auth?.data?.anon_id || '';
    const tid = auth?.data?.temp_id || '';
    const qp = new URLSearchParams();
    qp.set('chat', 'true');
    qp.set('profile', 'false');
    if (anon) qp.set('anon_id', anon); else if (tid) qp.set('temp_id', tid);
    const url = `${UNIFIED_URL}?${qp.toString()}`;
    return enqueue(() => axios.get(url, { headers: buildHeaders(auth) }).then(r => r?.data));
}