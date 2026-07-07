import {createContext , useContext ,  useEffect, useMemo, useState} from 'react';
import { readAnyUserAuthRow, saveUserAuthRow, clearUserAuthRow, readAnyVisitorAuthRow, saveVisitorAuthRow, clearVisitorAuthRow } from '../../user-home-page/logic/connectIndexedDB';

const UserContext = createContext(null);

export default function  UserProvider({children}){
     const  [auth  , _setAuth] = useState(() => {
         // Synchronous hydration from localStorage to survive reloads on protected routes
         try {
             const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
             return raw ? JSON.parse(raw) : null;
         } catch (_) { return null; }
     });
     const  [authLoading, setAuthLoading] = useState(true);
     const [operationType , setOperationType] = useState("REGISTER")

    // Hydrate auth from IndexedDB on mount (supports user or visitor)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // If we already have an auth in state, skip hydration
                if (auth) { setAuthLoading(false); return; }
                // Try user first
                const anyUser = await readAnyUserAuthRow();
                if (!cancelled && anyUser) { _setAuth(anyUser); }
                // If no user found, try visitor
                if (!cancelled && !anyUser) {
                    const anyVisitor = await readAnyVisitorAuthRow();
                    if (anyVisitor) _setAuth(anyVisitor);
                }
            } catch (_) { /* ignore */ }
            if (!cancelled) setAuthLoading(false);
        })();
        return () => { cancelled = true; };
    }, [auth]);

    // Wrap setter to persist to IndexedDB on successful login or clear on logout
    const setAuth = useMemo(() => (value) => {
        _setAuth(value);
        try {
            if (value && (value.data?.user_id || value.user_id)) {
                // persist/update row keyed by user_id
                saveUserAuthRow(value).catch(() => {});
                // localStorage persistence
                try { if (typeof localStorage !== 'undefined') localStorage.setItem('auth', JSON.stringify(value)); } catch(_) {}
                // optional convenience ids
                try { if (typeof localStorage !== 'undefined' && value?.data?.user_id) localStorage.setItem('user_id', String(value.data.user_id)); } catch(_) {}
                // clearing visitor rows if switching from visitor to user is optional; skip for now
                // notify listeners
                try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'user', id: value?.data?.user_id || value?.user_id } })); } catch(_) {}
            }
            // If server returned tokens but not yet a user_id (common during OAuth linking flows), persist tokens in localStorage
            else if (value && (value.data?.access_token || value.access_token)) {
                try { if (typeof localStorage !== 'undefined') localStorage.setItem('auth', JSON.stringify(value)); } catch(_) {}
                try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'token-only' } })); } catch(_) {}
            }
            else if (value === null) {
                // optional: clear all saved auth rows on logout (both types)
                clearUserAuthRow().catch(() => {});
                clearVisitorAuthRow().catch(() => {});
                try {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('auth');
                        localStorage.removeItem('visitor_id');
                        localStorage.removeItem('user_id');
                    }
                } catch(_) {}
                try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'none' } })); } catch(_) {}
            } else if (value && (value.data?.anon_id || value.visitor_id || value.anon_id)) {
                // persist visitor session
                saveVisitorAuthRow(value).catch(() => {});
                // localStorage persistence
                try {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('auth', JSON.stringify(value));
                        const vid = value?.data?.anon_id || value?.visitor_id || value?.anon_id;
                        if (vid) localStorage.setItem('visitor_id', String(vid));
                    }
                } catch(_) {}
                try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'visitor', id: value?.data?.anon_id || value?.visitor_id || value?.anon_id } })); } catch(_) {}
            }
        } catch (_) { /* ignore */ }
    }, []);

    return(
    <UserContext.Provider value={{auth , setAuth , setOperationType , operationType, authLoading}}>
            {children}
        </UserContext.Provider>
    )
}
export function useAuth(){
    const context = useContext(UserContext);
    if(!context){
        throw new Error("useAuth must be used within a UserProvider");
    }
    return context;
}