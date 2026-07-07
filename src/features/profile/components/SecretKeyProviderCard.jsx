import React, { useContext, useState, useMemo, useEffect } from 'react';
import {
    Card,
    TextField,
    IconButton,
    Typography,
} from "@mui/material";
import {OpenInNew , Circle } from '@mui/icons-material';
// ExpandMore no longer needed after removing Accordion
import CustomSwitch from "./CustomSwitch";
// Removed CategoryModelsCard dependency; use inline lightweight tiles instead
import CategoriesAccordion from './CategoriesAccordion';
import { SecretKeysContext } from '../contexts/SecretKeysContext';
import { ActivateLLMsProviderContext } from '../contexts/ActivateLLMsProviderContext';
import { CategoryContext } from '../contexts/CategoryContext';
import { getGoogleModelsData, getOpenRouterModelsData, getOpenAIModelsData, getHuggingFaceModelsData } from '../../user-home-page/logic/connectAI';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import '../profile-styles.css'
import { useTranslation } from 'react-i18next';


export default function SecretKeyProviderCard({ label , type }) {
    const { t } = useTranslation();
    const { keys, setKeys } = useContext(SecretKeysContext);
    const { setActivateLLMs, activateLLMs } = useContext(ActivateLLMsProviderContext);
    const { setCategories, selectedModels: persistedSelected } = useContext(CategoryContext);
    const [models, setModels] = useState([]);
    const [hasFetched, setHasFetched] = useState(false);
    const [query, setQuery] = useState('');
    // no separate filter mode now; categories always shown
    // track selected counts per category name
    const [categorySelectedCounts, setCategorySelectedCounts] = useState({});

    // determine provider key name in context (google|openai|openrouter|huggingface|lmstudio)
    const providerKey = (() => {
        const t = (type || label || '').toString().toLowerCase();
        if (t.includes('gemini') || t.includes('google')) return 'google';
        if (t.includes('openrouter') || t.includes('open router')) return 'openrouter';
        if (t.includes('openai') || t.includes('open ai')) return 'openai';
        if (t.includes('hugging') || t.includes('hf')) return 'huggingface';
        if (t.includes('lm studio') || t.includes('lmstudio') || (t.includes('lm') && t.includes('studio'))) return 'lmstudio';
        // default safe fallback (cards without a clear mapping default to Google/Gemini)
        return 'google';
    })();

    const provider = keys && keys[providerKey] ? keys[providerKey] : { enabled: false, key: '', valid: false };
    const enabled = !!provider.enabled;
    const isConnected = enabled && !!provider.key && !!provider.valid;
    const providerDisplayName = {
        google: 'Google',
        openrouter: 'OpenRouter',
        openai: 'OpenAI',
        lmstudio: 'LM Studio',
        huggingface: 'HuggingFace'
    }[providerKey] || (label || '');
    const statusText = (!provider.key ? t('profile.statusNotSet') : (isConnected ? t('profile.statusConnected') : t('profile.statusDisconnected')));
    const statusColor = (!provider.key ? '#9e9e9e' : (isConnected ? '#4caf50' : '#f44336'));
    

    const providerUrls = {
    google: 'https://console.cloud.google.com/apis/credentials',
    openai: 'https://platform.openai.com/account/api-keys',
    openrouter: 'https://openrouter.ai/',
    huggingface: 'https://huggingface.co/settings/tokens',
        lmstudio: 'http://127.0.0.1:1234'
    };

    const openProviderConsole = () => {
        // For LM Studio, prefer opening the configured base URL if present
        if (providerKey === 'lmstudio') {
            const base = (provider?.key || providerUrls.lmstudio);
            const safe = (base || '').trim() || providerUrls.lmstudio;
            window.open(safe, '_blank', 'noopener');
            return;
        }
        const url = providerUrls[providerKey] || null;
        if (url) {
            window.open(url, '_blank', 'noopener');
        } else {
            window.open('about:blank', '_blank');
        }
    };

    async function verifyKeyFor(key) {
        // Basic verification per provider: call a lightweight endpoint using provided key/base
        const k = (key || '').trim();
        if (providerKey === 'lmstudio') {
            // For LM Studio, key holds the base URL. Validate by calling /v1/models
            if (!k) return false;
            try {
                const url = k.replace(/\/$/, '') + '/v1/models';
                const rsp = await axios.get(url);
                return Array.isArray(rsp?.data?.data);
            } catch (_) {
                return false;
            }
        }
    if (!k) return false;
        try{
            if(providerKey === 'google'){
                const rsp = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
                return Array.isArray(rsp.data.models);
            }
            if(providerKey === 'huggingface'){
                // whoami-v2 requires auth; returns user info when token is valid
                const rsp = await axios.get(`https://huggingface.co/api/whoami-v2`, {
                    headers: { Authorization: `Bearer ${k}` }
                });
                return !!rsp?.data?.name || !!rsp?.data?.canPay;
            }
            if(providerKey === 'openrouter'){
                const rsp = await axios.get(`https://openrouter.ai/api/v1/models`, {
                    headers: { Authorization: `Bearer ${k}` }
                });
                return Array.isArray(rsp.data.data);
            }
            if(providerKey === 'openai'){
                const rsp = await axios.get(`https://api.openai.com/v1/models`, {
                    headers: { Authorization: `Bearer ${k}` }
                });
                return Array.isArray(rsp.data.data);
            }
            return false;
        }catch(err){
            return false;
        }
    }

    // Auto-verify when the key (or base URL for LM Studio) changes, debounced
    useEffect(() => {
        if (!enabled) return; // don't verify when provider is disabled
        const currentKey = (provider?.key || '').trim();
        if (!currentKey) {
            // Clear validity when empty
            setKeys(prev => ({
                ...(prev || {}),
                [providerKey]: { ...(prev?.[providerKey] || {}), valid: false }
            }));
            return;
        }
        const handle = setTimeout(async () => {
            const ok = await verifyKeyFor(currentKey);
            setKeys(prev => ({
                ...(prev || {}),
                [providerKey]: { ...(prev?.[providerKey] || {}), valid: ok }
            }));
        }, 700);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider?.key, enabled, providerKey]);

    async function handleFetchModels(){
        try{
            // if no key provided in UI for this provider, don't fetch
            const providerKeyInContext = keys[providerKey] || {};
            const uiKey = providerKeyInContext.key || '';
            if(!uiKey) {
                setModels([]);
                return;
            }

            function detectCategories(name = ''){
                const n = (name||'').toLowerCase();
                const cats = new Set();
                if(/chat|gpt|assistant|dialog|conversation/ig.test(n)) cats.add('Chat');
                if(/image|vision|img|clip|dall|stable|sd|imagegen|render/ig.test(n)) cats.add('Vision');
                if(/embed|embedding|vector/ig.test(n)) cats.add('Embeddings');
                if(/imagegen|dalle|generateimage/ig.test(n)) cats.add('ImageGen');
                if(/audio|tts|speech|wav|mp3/ig.test(n)) cats.add('Audio/TTS');
                if(cats.size === 0) cats.add('Chat');
                return Array.from(cats);
            }

            let raw = [];
            // debug log removed: never log key material (even a preview)
            if(providerKey === 'google'){
                raw = await getGoogleModelsData(uiKey);
                raw = (raw || []).map(m => ({ name: m.name, provider: 'Google', categories: detectCategories(m.name) }));
            } else if(providerKey === 'openrouter'){
                raw = await getOpenRouterModelsData(uiKey);
                raw = (raw || []).map(m => ({ name: m.id || m.name, provider: 'OpenRouter', categories: detectCategories(m.id || m.name) }));
            } else if(providerKey === 'openai'){
                raw = await getOpenAIModelsData(uiKey);
                raw = (raw || []).map(m => ({ name: m.id || m.name, provider: 'OpenAI', categories: detectCategories(m.id || m.name) }));
            } else if (providerKey === 'lmstudio') {
                // UI key is base URL; LM Studio follows OpenAI-style /v1/models without auth
                const base = uiKey.trim().replace(/\/$/, '');
                try {
                    const rsp = await axios.get(`${base}/v1/models`);
                    const data = Array.isArray(rsp?.data?.data) ? rsp.data.data : [];
                    raw = data.map((m) => ({ name: m.id || m.name, provider: 'LM Studio', categories: detectCategories(m.id || m.name) }));
                } catch (e) {
                    raw = [];
                }
            } else if (providerKey === 'huggingface') {
                raw = await getHuggingFaceModelsData(uiKey);
                raw = (raw || []).map(m => ({ name: m.id || m.name, provider: 'HuggingFace', categories: detectCategories(m.id || m.name) }));
            }
            setModels(raw || []);
            setHasFetched(true);
            // build categories map and update CategoryContext
            const map = {};
            for(const m of raw){
                const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : ['Chat'];
                for(const c of cats){
                    if(!map[c]) map[c] = [];
                    map[c].push(m);
                }
            }
            // update contexts: categories and activateLLMs
            try{
                // CategoryContext consumers expect an array of { name, count }
                const categoriesArray = Object.entries(map).map(([name, list]) => ({ name, count: (list||[]).length }));
                setCategories(categoriesArray);
            }catch(e){/* ignore if no provider */}

            try{
                const providerEntry = {
                    activate: true,
                    countActivated: (raw || []).length,
                    totalModels: (raw || []).length,
                    categories: Object.keys(map),
                    models: raw || []
                };
                setActivateLLMs(prev => ({ ...(prev||{}), [providerKey]: providerEntry }));
            }catch(e){/* ignore */}
        }catch(e){
            console.error(e);
            setModels([]);
            setHasFetched(true);
        }
    }

    // If models were previously fetched and stored in the ActivateLLMsProvider, restore them
    useEffect(() => {
        try{
            const entry = (activateLLMs || {})[providerKey];
            if (entry && Array.isArray(entry.models) && entry.models.length) {
                setModels(entry.models || []);
                setHasFetched(true);
                // rebuild categories map and push into CategoryContext so other components stay in sync
                try{
                    const map = {};
                    for(const m of (entry.models || [])){
                        const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : ['Chat'];
                        for(const c of cats){ if(!map[c]) map[c] = []; map[c].push(m); }
                    }
                    const categoriesArray = Object.entries(map).map(([name, list]) => ({ name, count: (list||[]).length }));
                    setCategories && setCategories(categoriesArray);
                }catch(e){/* ignore */}
            }
        }catch(e){/* ignore */}
    }, [activateLLMs, providerKey, setCategories]);

    // Keep top-level filter to reduce categories content (applied when building categoriesMap)

    const categoriesMap = useMemo(()=>{
        const map = {};
        const q = (query || '').toLowerCase();
        const source = q
            ? (models || []).filter(m => ((m.name||'').toLowerCase().includes(q) || (m.provider||'').toLowerCase().includes(q)))
            : (models || []);
        for(const m of source){
            const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : ['Chat'];
            for(const c of cats){
                if(!map[c]) map[c] = [];
                map[c].push(m);
            }
        }
        return map;
    },[models, query]);

    // Keep category selected counts in sync with persistedSelected (survives navigation)
    useEffect(() => {
        try{
            const counts = {};
            const persisted = Array.isArray(persistedSelected) ? persistedSelected : [];
            for(const [cat, list] of Object.entries(categoriesMap || {})){
                const names = new Set((list || []).map(m => m.name));
                let c = 0;
                for(const p of persisted){ if(p && p.name && names.has(p.name)) c++; }
                counts[cat] = c;
            }
            setCategorySelectedCounts(counts);
        }catch(e){/* ignore */}
    }, [categoriesMap, persistedSelected]);

    // No need to listen to autocomplete counts; show selected/total for this provider here

    // counts handled inline in render; no need to store separately

    return (
        <Card  className="section-provider-key" >
            <div className="header-provider-key">
                <div className="switch-and-label">
                    <CustomSwitch
                        checked={enabled}
                        onChange={(e, checked) => {
                            const updated = { ...keys };
                            updated[providerKey] = { ...updated[providerKey], enabled: !!checked };
                            setKeys(updated);
                        }}
                    />
                    <Typography className="provider-label">{label}</Typography>
                   <div style={{display:'flex', alignItems:'center'}}>
                       <Circle style={{ color: statusColor, marginRight: 6 }} />
                       <Typography className="provider-type">{statusText}</Typography>
                   </div>
                </div>
                <IconButton className="open-link-btn" onClick={openProviderConsole} aria-label={`open ${label} console`}>
                    <OpenInNew />
                </IconButton>
            </div>

                <div className="body-provider-key">
                <TextField
                    className={"secret-key-input"}
                    type={providerKey === 'lmstudio' ? 'text' : 'password'}
                    label={providerKey === 'lmstudio' ? t('profile.baseUrl') : t('profile.secretKey')}
                    size="small"
                    disabled={!enabled}
                    value={provider.key || ''}
                    onChange={(e) => {
                        const updated = { ...keys };
                        updated[providerKey] = { ...updated[providerKey], key: e.target.value };
                        setKeys(updated);
                    }}
                    placeholder={providerKey === 'lmstudio' ? 'http://127.0.0.1:1234' : ''}
                />
            </div>

            <div className="models-accordion-wrapper">
                <div className="models-header-row">
                    <div className="models-header-left">
                        <Typography className="models-title">{t('profile.models')}</Typography>
                        <Typography className="models-count" title="selected / total">
                            {(() => {
                                // Compute on the fly: selected across all categories for this provider vs total fetched here
                                const total = models.length;
                                const namesSet = new Set((models || []).map(m => m.name));
                                const sel = Array.isArray(persistedSelected)
                                    ? persistedSelected.filter(m => m && m.name && namesSet.has(m.name) && (m.provider === providerDisplayName)).length
                                    : 0;
                                return hasFetched ? `${sel}/${total}` : '0/0';
                            })()}
                        </Typography>
                    </div>
                    <div className="models-header-right">
                        <Button size="small" className={"fetch-models-button"} variant="contained" onClick={handleFetchModels} sx={{backgroundColor: provider.key ? '#4caf50' : '#ccc'}} disabled={!provider.key}>{t('profile.fetchModels')}</Button>
                    </div>
                </div>
                <div>
                    <div className="models-filter-row">
                        <TextField
                            size="small"
                            placeholder={t('profile.filterModels')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }}
                        />
                    </div>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                        {/* Render all categories as compact Cards; show selected counts and dim empty categories */}
                        {Object.keys(categoriesMap).map(cat => {
                            const list = categoriesMap[cat] || [];
                            const count = categorySelectedCounts && categorySelectedCounts[cat] ? categorySelectedCounts[cat] : 0;
                            const selected = count > 0;
                            return (
                <Card
                                    key={`cat-card-${cat}`}
                                    onClick={() => window.dispatchEvent(new CustomEvent('models:categorySelected', { detail: { category: cat, models: list } }))}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        width:"140px", 
                                        fontSize:"16px", 
                                        fontWeight: "bolder",
                                        height:"50px",
                                        cursor: 'pointer',
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        boxShadow: selected ? '0 2px 6px rgba(99,102,241,0.18)' : '0 1px 3px rgba(0,0,0,0.06)',
                    backgroundColor: selected ? '#635ef1' : 'var(--pro-card)',
                    color: selected ? '#fff' : 'var(--pro-text)',
                    border: selected ? '1px solid rgba(99,102,241,.45)' : '1px solid var(--pro-border)',
                                        opacity: selected ? 1 : 0.95
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <Typography variant="body2" style={{ fontWeight: 500 }}>{cat}</Typography>
                                        <Typography variant="caption" style={{ opacity: 0.85 }}>{`(${count})`}</Typography>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    {models.length === 0 ? (
                        <div style={{padding:12}}>
                            <Typography variant="body2" color="textSecondary">{t('profile.noModelsAvailable')}</Typography>
                        </div>
                    ) : (
                        <div>
                            {/* Always show categories with ToggleButtons; remove flat tiles */}
                            <div style={{marginBottom:8}}>
                                <CategoriesAccordion categoriesMap={categoriesMap} onModelToggle={(m, willSelect, selectedSet)=>{
                                    // update per-category selected counts
                                    const counts = {};
                                    for(const [cat, list] of Object.entries(categoriesMap)){
                                        let c = 0;
                                        for(const item of list){ if(selectedSet.has(item.name)) c++; }
                                        counts[cat] = c;
                                    }
                                    setCategorySelectedCounts(counts);
                                }} />
                               
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}