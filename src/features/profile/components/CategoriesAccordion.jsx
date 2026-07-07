import React, { useState, useContext, useEffect } from 'react';
import CategoryAccordion from './CategoryAccordion';
import { CategoryContext } from '../contexts/CategoryContext';

export default function CategoriesAccordion({ categoriesMap = {}, onModelToggle }){
    // categoriesMap is an object: { categoryName: [models...] }
    const cats = Object.keys(categoriesMap || {});
    // track selected model names across all categories
    const { selectedModels: persistedSelected, setSelectedModels: setPersistedSelected } = useContext(CategoryContext);
    // keep a Set for fast membership checks in UI
    const [selectedModels, setSelectedModels] = useState(new Set((persistedSelected || []).map(m => m.name)));

    useEffect(()=>{
        // if persistedSelected changes (e.g., from other places), sync into Set
        setSelectedModels(new Set((persistedSelected || []).map(m => m.name)));
    }, [persistedSelected]);

    function handleModelToggle(model, willSelect){
        const next = new Set(selectedModels);
        if(willSelect) next.add(model.name); else next.delete(model.name);
        setSelectedModels(next);
        // update persisted list of full model objects
        try{
            const current = new Map((persistedSelected || []).map(m => [m.name, m]));
            if(willSelect) current.set(model.name, model); else current.delete(model.name);
            setPersistedSelected(Array.from(current.values()));
        }catch(e){/* ignore */}
        // bubble up to parent with the current model and selection state
        onModelToggle && onModelToggle(model, willSelect, next);
        // notify autocomplete / other listeners about the selection change
        try{
            if(willSelect){
                window.dispatchEvent(new CustomEvent('models:modelSelected', { detail: { model } }));
            } else {
                // send an empty model to indicate deselect (autocomplete listens and will clear)
                window.dispatchEvent(new CustomEvent('models:modelSelected', { detail: { model: { name: '', provider: '' } } }));
            }
        }catch(e){
            // ignore if window not available in some environments
        }
    }

    function handleSelectAll(category, willSelect){
        const list = categoriesMap[category] || [];
        // Build new persisted map from existing persistedSelected to avoid per-item races
        try{
            const current = new Map((persistedSelected || []).map(m => [m.name, m]));
            for(const m of list){
                if (willSelect) current.set(m.name, m); else current.delete(m.name);
            }
            const newPersisted = Array.from(current.values());
            setPersistedSelected(newPersisted);
            // Update local Set once
            setSelectedModels(new Set(newPersisted.map(m => m.name)));
            // notify parent/counts for each model
            for(const m of list){
                onModelToggle && onModelToggle(m, willSelect, new Set(newPersisted.map(x => x.name)));
            }
        }catch(e){
            // fallback to previous behavior
            const next = new Set(selectedModels);
            for(const m of list){ if(willSelect) next.add(m.name); else next.delete(m.name); }
            setSelectedModels(next);
        }
    }

    return (
        <div>
                {cats.map(cat => (
                <CategoryAccordion  key={cat} category={cat} models={categoriesMap[cat]} onModelToggle={handleModelToggle} selectedModels={selectedModels} onSelectAll={handleSelectAll} />
            ))}
        </div>
    )
}
