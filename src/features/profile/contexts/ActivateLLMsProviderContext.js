import {createContext, useState, useMemo, useEffect, useContext} from 'react' ;
import { SecretKeysContext } from '../contexts/SecretKeysContext';
import { getAllModelsData, mapProviderToKey } from '../../user-home-page/logic/connectAI';

export const ActivateLLMsProviderContext = createContext(null);

export function ActivateLLMsProviderReactProvider({children}){
    // keyed by provider key (google, openrouter, openai, ...)
    const initialActivateProvider = {
        google: true,
        openrouter:false,
    openai: false,
    huggingface: false,
    lmstudio: false
    }
    const [activateLLMs , setActivateLLMs] = useState(initialActivateProvider);
    // store all fetched models (flat list of { name, provider, ... })
    const [allModels, setAllModels] = useState([]);

    // Safe access keys context (guard null)
    const keysCtx = useContext(SecretKeysContext);
    const keys = keysCtx?.keys;

    // fetch all models when secret keys change (or manually via refresh)
    async function refreshAllModels() {
        try{
            const data = await getAllModelsData(keys);
            // normalize to minimal shape
            const normalized = (data || []).map(m => ({ name: m.name || m.id || '', provider: m.provider || m.providerName || '' , raw: m }));
            setAllModels(normalized);
            return normalized;
        }catch(e){
            setAllModels([]);
            return [];
        }
    }

    useEffect(()=>{
        // don't fetch if no keys object available
        if(!keysCtx) return; // not within SecretKeysContext yet
        refreshAllModels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys]);

    // derive a simple map of providerKey -> boolean activate for easy checks
    const activateMap = useMemo(() => {
        const map = {};
        try{
            Object.entries(activateLLMs || {}).forEach(([k, v]) => {
                // v may be { activate: boolean, ... } or a plain boolean in some shapes
                if (typeof v === 'boolean') {
                    map[k] = v;
                } else if (v && typeof v === 'object') {
                    map[k] = !!v.activate;
                } else {
                    map[k] = false;
                }
            });
        }catch(e){/* ignore */}
        return map;
    }, [activateLLMs]);

    // also expose a Set of active keys (lowercased) for fast membership checks
    const activeKeysSet = useMemo(() => {
        const s = new Set();
        try{
            Object.entries(activateMap || {}).forEach(([k, v]) => { if (v) s.add((k||'').toLowerCase()); });
        }catch(e){}
        return s;
    }, [activateMap]);

    // activeModels are the models filtered by active provider keys
    const activeModels = useMemo(() => {
        try{
            if(!allModels || !allModels.length) return [];
            return allModels.filter(m => {
                const providerKey = (mapProviderToKey(m.provider) || '').toLowerCase();
                return activeKeysSet.has(providerKey);
            }).map(m => ({ name: m.name, provider: m.provider, raw: m.raw }));
        }catch(e){ return []; }
    }, [allModels, activeKeysSet]);

    return (
        <ActivateLLMsProviderContext.Provider value={{
            activateLLMs,
            setActivateLLMs,
            activateMap,
            activeKeysSet,
            allModels,
            activeModels,
            refreshAllModels
        }}>
            {children}
        </ActivateLLMsProviderContext.Provider>
    )
}
