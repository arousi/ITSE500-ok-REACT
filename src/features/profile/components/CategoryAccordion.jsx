import { Box, Typography, ToggleButton, Button, TextField, InputAdornment} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';
import { Accordion , AccordionSummary  ,AccordionDetails} from '../../dashboard/components/CustomAccordions';
import SearchIcon from '@mui/icons-material/Search';
import '../profile-styles.css';
import { Check } from '@mui/icons-material';
export default function CategoryAccordion({ category, models = [] , onModelToggle, selectedModels, onSelectAll }) {
    const [query, setQuery] = React.useState('');
    const total = (models || []).length;
    const selectedCount = (models || []).reduce((acc, m) => acc + ((selectedModels && selectedModels.has && selectedModels.has(m.name)) ? 1 : 0), 0);
    let stateLabel = 'None';
    if(total === 0) stateLabel = 'None';
    else if(selectedCount === 0) stateLabel = 'None';
    else if(selectedCount === total) stateLabel = 'All';
    else stateLabel = 'Part';

    const handleSelectAllClick = () => {
        const willSelect = !(selectedCount === total);
        // ask parent to select/deselect all in this category
        onSelectAll && onSelectAll(category, willSelect);
    }

    return (
        <Accordion  className={"category-accordion"}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                    <Typography sx={{fontWeight:600}}>{category} <span style={{marginLeft:8, color:'#666'}}>{models.length}</span></Typography>
                    <Button size="small" className={"total-selected-btn"} sx={{backgroundColor:stateLabel === "All"?"rgba(115, 197, 115, 1);":"rgba(133, 94, 243, 1)"}} onClick={(e)=>{ e.stopPropagation(); handleSelectAllClick(); }}>{stateLabel}</Button>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                        
                        size="small"
                        placeholder={`Search in ${category}`}
                        value={query}
                        onChange={(e)=> setQuery(e.target.value)}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }}
                        className="category-search-field"
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {(models || []).filter(m => {
                        const q = (query || '').toLowerCase();
                        if(!q) return true;
                        return (m.name||'').toLowerCase().includes(q);
                    }).map((m, idx) => {
                        const isSelected = selectedModels && (typeof selectedModels.has === 'function'
                            ? selectedModels.has(m.name)
                            : Array.isArray(selectedModels) ? selectedModels.includes(m.name) : false);
                        return (
                                                        <ToggleButton
                                                            className={"model-toggle-button"}
                                                            key={m.name || idx}
                                                            value={m.name}
                                                            selected={isSelected}
                                                            onClick={() => onModelToggle && onModelToggle(m, !isSelected)}
                                                        >
                              {isSelected?<Check />:""}  {m.name}
                            </ToggleButton>
                        )
                    })}
                    </Box>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}
