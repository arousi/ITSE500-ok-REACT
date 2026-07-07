import {Autocomplete , TextField} from '@mui/material';
import {useState , useEffect , useContext, useRef} from 'react';
import {ActivateLLMsProviderContext} from "../../profile/contexts/ActivateLLMsProviderContext";
import {getAllModelsData, mapProviderToKey} from "../logic/connectAI";
import { SecretKeysContext } from '../../profile/contexts/SecretKeysContext';
import {ModelSelectedContext} from "../contexts/ModelSelectedContext";
import { CategoryContext } from '../../profile/contexts/CategoryContext';

import { loadSelectedModels, saveSelectedModels } from '../../profile/logic/idbAppStorage';

export default function ModelsAutoComplete() {
    const[models , setModels] = useState([]);
    const [value, setValue] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const acRef = useRef(null);
    const { setModelSelected} = useContext(ModelSelectedContext)
    const {activeKeysSet} = useContext(ActivateLLMsProviderContext);
    const { keys } = useContext(SecretKeysContext);
    const { selectedModels: persistedSelected, setSelectedModels: setPersistedSelected } = useContext(CategoryContext);

     useEffect(()=>{
            // initial hydration for selected models (value)
            let cancelled = false;
            // compute owner key from localStorage to match contexts
            const ownerKey = (() => {
                try {
                    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
                    if (!raw) return 'local';
                    const auth = JSON.parse(raw);
                    const uid = auth?.data?.user_id || auth?.user_id;
                    const vid = auth?.data?.anon_id || auth?.visitor_id || auth?.anon_id;
                    return uid ? `user:${uid}` : (vid ? `visitor:${vid}` : 'local');
                } catch(_) { return 'local'; }
            })();
            loadSelectedModels(ownerKey).then(list => {
                if (cancelled) return;
                const first = Array.isArray(list) && list.length ? list[0] : null;
                if (first) setValue(first);
            }).catch(()=>{});

         async function fetchData(){
          // Prefer persisted selected models (CategoryContext) as the authoritative source for autocomplete options
          const persisted = Array.isArray(persistedSelected) ? persistedSelected.filter(m => m && m.name) : [];
          if(persisted.length){
              // Filter persisted by connected providers only
              const byKey = new Map();
              for(const m of persisted){
                  const providerKey = (mapProviderToKey(m.provider) || '').toLowerCase();
                  const connected = !!keys?.[providerKey]?.enabled && !!keys?.[providerKey]?.valid;
                  if (!connected) continue;
                  const k = `${m.name}|${m.provider}`;
                  if(!byKey.has(k)) byKey.set(k, { name: m.name, provider: m.provider });
              }
              const merged = Array.from(byKey.values());
              if (merged.length > 0) {
                  setModels(merged);
                  return;
              }
          }

          // fallback: fetch all models and filter by connected providers (enabled && valid)
          const data  = await getAllModelsData(keys);
          const filtered = (data || []).filter((model)=>{
              const providerKey = (mapProviderToKey(model.provider) || '').toLowerCase();
              const connected = !!keys?.[providerKey]?.enabled && !!keys?.[providerKey]?.valid;
              return (!activeKeysSet || activeKeysSet.has(providerKey)) && connected;
          }).map(m => ({ name: m.name, provider: m.provider }));
          setModels(filtered);
         }
         fetchData();

         // listener for category selection events -> replace options with category models
         const catHandler = (e) => {
             const detail = e?.detail;
             if(!detail) return;
             const catModels = Array.isArray(detail.models) ? detail.models : [];
             const filtered = catModels.filter((model)=>{
                 const providerKey = (mapProviderToKey(model.provider) || '').toLowerCase();
                 const connected = !!keys?.[providerKey]?.enabled && !!keys?.[providerKey]?.valid;
                 return (!activeKeysSet || activeKeysSet.has(providerKey)) && connected;
             }).map(m => ({ name: m.name, provider: m.provider }));
             setModels(filtered);
         }

        // listener for individual model selection from Category/tiles/Toggle
        const modelHandler = (e) => {
             const detail = e?.detail;
             if(!detail || !detail.model) return;
             const m = detail.model;
             if(!m || !m.name){
                 // deselect signal -> clear
                 setModelSelected({ name: '', provider: '' });
                 setValue(null);
                 return;
             }
             // ensure option shape
             const option = { name: m.name, provider: m.provider };
             const providerKey = (mapProviderToKey(option.provider) || '').toLowerCase();
             const connected = !!keys?.[providerKey]?.enabled && !!keys?.[providerKey]?.valid;
             if (!connected) return; // ignore selection from disconnected provider
             setModelSelected({ name: option.name, provider: option.provider });
             setValue(option);
             // ensure selected remains in options; don't wipe list
             setModels(prev => {
                 try{
                     if(prev.some(x => x.name === option.name && x.provider === option.provider)) return prev;
                 }catch(e){}
                 return [option, ...prev];
             })
         }

         window.addEventListener('models:categorySelected', catHandler);
         window.addEventListener('models:modelSelected', modelHandler);
         return () => {
             cancelled = true;
             window.removeEventListener('models:categorySelected', catHandler);
             window.removeEventListener('models:modelSelected', modelHandler);
         }
    }, [activeKeysSet, keys, setModelSelected, persistedSelected])
    // Announce option count to other UI (e.g., SecretKeyProviderCard) for "available/total" display
    useEffect(() => {
        try{
            const byProvider = {};
            for(const m of (models || [])){
                const p = (m?.provider || '').toString();
                byProvider[p] = (byProvider[p] || 0) + 1;
            }
            window.dispatchEvent(new CustomEvent('models:acOptionsCount', { detail: { available: (models || []).length, byProvider } }));
        }catch(e){/* ignore */}
    }, [models]);
     return (
         <Autocomplete
             ref={acRef}
             sx={{ width: 300 }}
             options={models}
             value={value}
             inputValue={inputValue}
             onInputChange={(event, newInputValue, reason) => {
                 // reset filter after selection or close, otherwise keep what user types
                 if (reason === 'reset' || reason === 'clear') {
                     setInputValue('');
                 } else {
                     setInputValue(newInputValue || '');
                 }
             }}
         onChange={(event, newValue) => {
                 setValue(newValue);
                 setInputValue('');
                 if (newValue) {
                     setModelSelected({
                         name: newValue.name,
                         provider: newValue.provider
                     });
             // persist selection list (keep first item as selected)
             const ownerKey2 = (() => { try { const raw = localStorage.getItem('auth'); if (!raw) return 'local'; const a = JSON.parse(raw); const uid=a?.data?.user_id||a?.user_id; const vid=a?.data?.anon_id||a?.visitor_id||a?.anon_id; return uid?`user:${uid}`:(vid?`visitor:${vid}`:'local'); } catch(_) { return 'local'; } })();
             saveSelectedModels([newValue, ...models.filter(m => m.name !== newValue.name || m.provider !== newValue.provider)], ownerKey2).catch(()=>{});
                 } else {
                     setModelSelected({ name: '', provider: '' });
             const ownerKey3 = (() => { try { const raw = localStorage.getItem('auth'); if (!raw) return 'local'; const a = JSON.parse(raw); const uid=a?.data?.user_id||a?.user_id; const vid=a?.data?.anon_id||a?.visitor_id||a?.anon_id; return uid?`user:${uid}`:(vid?`visitor:${vid}`:'local'); } catch(_) { return 'local'; } })();
             saveSelectedModels([], ownerKey3).catch(()=>{});
                 }
             }}
             // Use default filtering (by label); show popup on focus/typing only
             openOnFocus
             getOptionLabel={(option) => option?.name || ''}
             groupBy={(option) => option?.provider || ''}
             renderInput={(params) => (
                 <TextField {...params} label="Select model" />
             )}
         />
    )
}