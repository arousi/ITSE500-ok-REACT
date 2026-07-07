import {createContext , useEffect, useMemo, useState} from 'react';
import { loadSecretKeys, saveSecretKeys } from '../logic/idbAppStorage';
export const SecretKeysContext = createContext(null);

export function SecretKeysProvider({ children }) {
    // derive ownerKey from localStorage-auth to avoid depending on UserProvider position
    const computeOwnerKey = () => {
        try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
            if (!raw) return 'local';
            const auth = JSON.parse(raw);
            const uid = auth?.data?.user_id || auth?.user_id || '';
            const vid = auth?.data?.anon_id || auth?.visitor_id || auth?.anon_id || '';
            return uid ? `user:${uid}` : (vid ? `visitor:${vid}` : 'local');
        } catch (_) { return 'local'; }
    };
    const [ownerKey, setOwnerKey] = useState(computeOwnerKey);
    useEffect(() => {
        const handler = () => setOwnerKey(computeOwnerKey());
        try { window.addEventListener('auth:changed', handler); } catch(_) {}
        return () => { try { window.removeEventListener('auth:changed', handler); } catch(_) {} };
    }, []);

    // This context can be used to manage secret keys across the application
    const secretKeys = useMemo(() => ({
        google: {
            label: 'Google',
            type: 'GOOGLE',
            enabled: false,
            key: '',
            valid: false
        },
        openai: {
            label: 'OpenAI',
            type: 'OPENAI',
            enabled: false,
            key: '',
            valid: false
        },
        openrouter: {
            label: 'OpenRouter',
            type: 'OPENROUTER',
            enabled: false,
            key: '',
            valid: false
        },
        huggingface: {
            label: 'HuggingFace',
            type: 'HUGGINGFACE',
            enabled: false,
            key: '',
            valid: false
        },
        lmstudio: {
            label: 'LM Studio',
            type: 'LM_STUDIO',
            enabled: false,
            // For LM Studio, key holds the base URL (e.g., http://127.0.0.1:1234)
            key: '',
            valid: false
        }
    }), []);
    const [keys, setKeys] = useState(secretKeys);
    const [loaded, setLoaded] = useState(false);

    // Load persisted keys from IndexedDB on mount
    useEffect(() => {
        let cancelled = false;
        loadSecretKeys(ownerKey)
            .then(stored => {
                if (cancelled) return;
                if (stored && typeof stored === 'object') {
                    setKeys(prev => ({ ...prev, ...stored }));
                } else {
                    // reset to defaults on owner switch to avoid showing previous owner's keys
                    setKeys(secretKeys);
                }
            })
            .finally(() => setLoaded(true));
        return () => { cancelled = true; };
    }, [ownerKey, secretKeys]);

    // Persist keys whenever they change (after initial load)
    useEffect(() => {
        if (!loaded) return;
        saveSecretKeys(keys, ownerKey).catch(() => {/* ignore */});
    }, [keys, loaded, ownerKey]);
    return (
        <SecretKeysContext.Provider value={{ keys , setKeys }}>
            {children}
        </SecretKeysContext.Provider>
    );
}