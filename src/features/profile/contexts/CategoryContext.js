import {createContext, useState, useEffect} from 'react';
import { loadSelectedModels, saveSelectedModels } from '../logic/idbAppStorage';

export const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
    const computeOwnerKey = () => {
        try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
            if (!raw) return 'local';
            const auth = JSON.parse(raw);
            const uid = auth?.data?.user_id || auth?.user_id;
            const vid = auth?.data?.anon_id || auth?.visitor_id || auth?.anon_id;
            return uid ? `user:${uid}` : (vid ? `visitor:${vid}` : 'local');
        } catch (_) { return 'local'; }
    };
    const [ownerKey, setOwnerKey] = useState(computeOwnerKey);
    useEffect(() => {
        const handler = () => setOwnerKey(computeOwnerKey());
        try { window.addEventListener('auth:changed', handler); } catch(_) {}
        return () => { try { window.removeEventListener('auth:changed', handler); } catch(_) {} };
    }, []);
    const [categories, setCategories] = useState([]);
    // persist selected models as array of {name, provider}
    const [selectedModels, setSelectedModels] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadSelectedModels(ownerKey)
            .then(models => { if (!cancelled) setSelectedModels(Array.isArray(models) ? models : []); })
            .finally(() => { if (!cancelled) setLoaded(true); });
        return () => { cancelled = true; };
    }, [ownerKey]);

    useEffect(()=>{
        if (!loaded) return;
        saveSelectedModels(selectedModels, ownerKey).catch(() => {/* ignore */});
    }, [selectedModels, loaded, ownerKey]);

    return (
        <CategoryContext.Provider value={{ categories, setCategories, selectedModels, setSelectedModels }}>
            {children}
        </CategoryContext.Provider>
    );
}