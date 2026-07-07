import axios from "axios";
import env from "../../../config/env";

// Shared base configured via centralized env (no hardcoded host fallback).
const BASE = env.apiBaseUrl;
const PROFILE_URL = `${BASE}/api/v1/unified-sync/`;

export async function updateProfile(userUpdated, auth) {
    if (!auth?.data?.access_token) throw new Error('Missing access token');
    const params = new URLSearchParams();
    params.set('profile', 'true');
    params.set('chat', 'false');
    const body = {
        user_id: auth?.data?.user_id || auth?.data?.id,
        profile: userUpdated,
    };
    return axios.post(`${PROFILE_URL}?${params.toString()}`, body, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.data.access_token}`,
        },
    }).then(r => r?.data);
}

export async function getProfile(auth) {
    if (!auth?.data?.access_token) throw new Error('Missing access token');
    const qp = new URLSearchParams();
    qp.set('profile', 'true');
    qp.set('chat', 'false');
    const id = auth?.data?.user_id || auth?.data?.id;
    if (id) qp.set('user_id', id);
    return axios.get(`${PROFILE_URL}?${qp.toString()}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.data.access_token}`,
        },
    }).then(r => r?.data);
}