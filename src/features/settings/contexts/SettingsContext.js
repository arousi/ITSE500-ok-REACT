import {createContext, useEffect, useMemo, useState} from 'react';
import { readSettingsForOwner, saveSettingsForOwner } from '../../user-home-page/logic/connectIndexedDB';
import { useAuth } from '../../register/contexts/UserProvider';

export const SettingsContext = createContext(null);

export function  SettingsProvider({children}) {
    const initialSettings = {
        temperature: 0.7,
        top_k: 40,
        repeat_penalty: 1.1,
        top_p: 0.9,
        min_p: 0.05,
        // Structured output (JSON Schema) options
        structured_output_enabled: false,
    structured_output_schema: '',
    // System prompt injection options
    system_prompt_enabled: false,
    system_prompt: '',
    // Response length control
    limit_response_length: false,
    max_tokens: 256
    };
    const [settings , setSettings] = useState(initialSettings);
    const { auth } = useAuth?.() || { auth: null };
    const [isLoaded, setIsLoaded] = useState(false);

    const owner = useMemo(() => ({
        user_id: auth?.data?.user_id || '',
        // fall back to any persisted visitor id when logged out or unauthenticated
        visitor_id: auth?.data?.anon_id || (typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '')
    }), [auth?.data?.user_id, auth?.data?.anon_id]);

    // Load settings for current owner once (or whenever owner changes)
    useEffect(() => {
        let cancelled = false;
        setIsLoaded(false);
        readSettingsForOwner(owner)
            .then(row => {
                if (cancelled) return;
                if (row && typeof row === 'object') {
                    // merge with defaults in case new keys are added in the future
                    setSettings(prev => ({ ...initialSettings, ...row }));
                } else {
                    // keep current settings (or defaults) but don't overwrite existing owner settings yet
                    setSettings(prev => ({ ...initialSettings, ...prev }));
                }
                setIsLoaded(true);
            })
            .catch(() => { setIsLoaded(true); /* ignore */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner.user_id, owner.visitor_id]);

    // Persist settings whenever they change (debounced-ish via effect turn)
    useEffect(() => {
        // Avoid saving defaults over existing records during owner switches until load completes
        if (!isLoaded) return;
        saveSettingsForOwner(settings, owner).catch(() => {/* ignore */});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, isLoaded]);

    return(
        <SettingsContext.Provider value={{settings , setSettings}}>
            {children}
        </SettingsContext.Provider>
    )
}