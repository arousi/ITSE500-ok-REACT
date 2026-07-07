import React, { useContext, useState } from 'react';
import {
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Switch,
    Slider,
    TextField,
    Box,
    Stack,
    FormControlLabel,
    useMediaQuery, 
    useTheme , 
    RadioGroup,
    Radio 
} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import {OptionStorageContext} from '../../profile/contexts/OptionStorageContext';
import {Accordion , AccordionDetails , AccordionSummary} from '../../dashboard/components/CustomAccordions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DisplayConfigurationContext } from '../../dashboard/contexts/DisplayConfigurationContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { ChatInferenceOptionContext } from '../contexts/ChatInferenceOptionContext';
import { SecretKeysContext } from '../../profile/contexts/SecretKeysContext';
export function ConfigurationDialog() {
    const { displayConfiguration, setDisplayConfiguration } = useContext(DisplayConfigurationContext);
    // global settings (values) and toggles (enabled flags)
    const { settings, setSettings } = useContext(SettingsContext);
    const { chatInferenceOption, setChatInferenceOption } = useContext(ChatInferenceOptionContext);
    const { storageOption, setStorageOption } = useContext(OptionStorageContext);
    const { keys } = useContext(SecretKeysContext);

    // local UI state for accordion expansion
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // local configuration state (defaults) — providers and non-inference options remain local
    const [config, setConfig] = useState({
        providers: {
            Gemini: true,
            'LM Studio': false,
            OpenAI: false,
            OpenRouter: false
        },
        settings: {
                systemPromptEnabled: !!settings.system_prompt_enabled,
                systemPrompt: settings.system_prompt || '',
                limitResponseLength: !!settings.limit_response_length,
                maxTokens: Number(settings.max_tokens ?? 256)
        },
        sampling: {
            // sampling values now live in SettingsContext; toggles live in ChatInferenceOptionContext
        },
        structuredOutput: {
            enabled: false,
            schema: '{"type":"object","properties":{}}'
        }
    });

    const handleClose = () => {
        setDisplayConfiguration(false);
    };

    const handleSave = () => {
        // Merge local config into global SettingsContext, which persists via effect
        setSettings(prev => ({
            ...prev,
            system_prompt_enabled: !!config.settings.systemPromptEnabled,
            system_prompt: config.settings.systemPrompt || '',
            limit_response_length: !!config.settings.limitResponseLength,
            max_tokens: Number(config.settings.maxTokens || 0) || 0
        }));
        // Close after save
        setDisplayConfiguration(false);
    };

    const handleToggleProvider = (name) => {
        setConfig(prev => ({ ...prev, providers: { ...prev.providers, [name]: !prev.providers[name] } }));
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Dialog className="config-dialog" fullScreen={fullScreen}  PaperProps={{
                className: 'config-dialog-paper',
                sx: {
                    borderRadius: 2,
                    // fixed height on desktop, full height on small screens
                    height: fullScreen ? '100vh' : '70vh',
                    maxHeight: fullScreen ? '100vh' : 900,
                    width: fullScreen ? '100%' : '80%',
                }
            }} open={!!displayConfiguration} onClose={handleClose} fullWidth maxWidth="md" >
            <DialogTitle className="config-dialog-title">Configuration</DialogTitle>
            <DialogContent className="config-dialog-content" >
                <Stack  sx={{maxHeight:500}} spacing={2}>
                    <Accordion expanded={expanded === 'providers'} onChange={handleAccordionChange('providers')}>
                        <AccordionSummary  expandIcon={<ExpandMoreIcon />}>
                            <Typography>Providers</Typography>
                        
                        </AccordionSummary>
                        
                        <AccordionDetails>
                           
                            <Stack spacing={2}>
                                {Object.keys(config.providers).map((p) => {
                                    // map UI provider name to SecretKeysContext key
                                    const providerKeyMap = { 'Gemini': 'google', 'OpenAI': 'openai', 'OpenRouter': 'openrouter', 'LM Studio': 'lmstudio' };
                                    const ctxKey = providerKeyMap[p] || '';
                                    const isValid = !!keys?.[ctxKey]?.valid;
                                    return (
                                        <Box key={p} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography>
                                                <CircleIcon sx={{ width: 12, height: 12, color: isValid ? 'green' : 'red', marginRight: 1 }} />
                                                {p}
                                            </Typography>
                                            <Switch checked={!!config.providers[p]} onChange={() => handleToggleProvider(p)} />
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion expanded={expanded === 'settings'} onChange={handleAccordionChange('settings')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                                    <FormControlLabel control={<Switch checked={config.settings.systemPromptEnabled} onChange={() => setConfig(prev => ({...prev, settings: {...prev.settings, systemPromptEnabled: !prev.settings.systemPromptEnabled}}))} />} label="System Prompt" />
                                </Box>
                                <TextField disabled={!config.settings.systemPromptEnabled} multiline minRows={3} placeholder="Enter a persistent system instruction (e.g., You are a helpful assistant...)" value={config.settings.systemPrompt} onChange={(e)=>setConfig(prev=>({...prev, settings:{...prev.settings, systemPrompt: e.target.value}}))} />

                                <Box sx={{display:'flex', gap:2, alignItems:'center'}}>
                                    <Switch checked={!!chatInferenceOption.temperatureOpen} onChange={() => setChatInferenceOption(prev => ({...prev, temperatureOpen: !prev.temperatureOpen}))} />
                                    <Typography>Temperature</Typography>
                                    <Slider disabled={!chatInferenceOption.temperatureOpen} value={Number(settings.temperature) || 0} onChange={(e, v)=> setSettings(prev => ({...prev, temperature: Array.isArray(v)? v[0] : v}))} min={0} max={1} step={0.01} sx={{mx:2, flex:1}} />
                                    <Typography>{Number(settings.temperature).toFixed(2)}</Typography>
                                </Box>

                                <Box sx={{display:'flex', gap:2, alignItems:'center'}}>
                                    <Switch checked={config.settings.limitResponseLength} onChange={()=>setConfig(prev=>({...prev, settings:{...prev.settings, limitResponseLength: !prev.settings.limitResponseLength}}))} />
                                    <Typography>Limit Response Length</Typography>
                                    <TextField
                                        type="number"
                                        size="small"
                                        disabled={!config.settings.limitResponseLength}
                                        value={config.settings.maxTokens}
                                        onChange={(e)=> setConfig(prev=> ({...prev, settings:{...prev.settings, maxTokens: Number(e.target.value || 0)}}))}
                                        sx={{ width: 140, ml: 2 }}
                                        inputProps={{ min: 1 }}
                                        label="Max tokens"
                                    />
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion expanded={expanded === 'sampling'} onChange={handleAccordionChange('sampling')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Sampling</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                         <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                             <Switch checked={!!chatInferenceOption.topKOpen} onChange={()=>setChatInferenceOption(prev=>({...prev, topKOpen: !prev.topKOpen}))} />
                                    <Typography>Top K</Typography>
                                    <Slider disabled={!chatInferenceOption.topKOpen} value={Number(settings.top_k) || 0} onChange={(e,v)=>setSettings(prev=>({...prev, top_k: Array.isArray(v)? v[0] : v}))} min={0} max={200} sx={{mx:2, flex:1}} />
                                    <Typography>{Number(settings.top_k)}</Typography>
                                </Box>

                                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                                    <Switch checked={!!chatInferenceOption.repeatPenaltyOpen} onChange={()=>setChatInferenceOption(prev=>({...prev, repeatPenaltyOpen: !prev.repeatPenaltyOpen}))} />
                                    <Typography>Repeat Penalty</Typography>
                                    <Slider disabled={!chatInferenceOption.repeatPenaltyOpen} value={Number(settings.repeat_penalty) || 0} onChange={(e,v)=>setSettings(prev=>({...prev, repeat_penalty: Array.isArray(v)? v[0] : v}))} min={0.1} max={2} step={0.01} sx={{mx:2, flex:1}} />
                                    <Typography>{Number(settings.repeat_penalty).toFixed(2)}</Typography>
                                </Box>

                                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                                    <Switch checked={!!chatInferenceOption.minPOpen} onChange={()=>setChatInferenceOption(prev=>({...prev, minPOpen: !prev.minPOpen}))} />
                                    <Typography>Min P</Typography>
                                    <Slider disabled={!chatInferenceOption.minPOpen} value={Number(settings.min_p) || 0} onChange={(e,v)=>setSettings(prev=>({...prev, min_p: Array.isArray(v)? v[0] : v}))} min={0} max={1} step={0.01} sx={{mx:2, flex:1}} />
                                    <Typography>{Number(settings.min_p).toFixed(2)}</Typography>
                                </Box>

                                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                                    <Switch checked={!!chatInferenceOption.topPOpen} onChange={()=>setChatInferenceOption(prev=>({...prev , topPOpen: !prev.topPOpen}))} />
                                    <Typography>Top P</Typography>
                                    <Slider disabled={!chatInferenceOption.topPOpen} value={Number(settings.top_p) || 0} onChange={(e,v)=>setSettings(prev=>({...prev, top_p: Array.isArray(v)? v[0] : v}))} min={0} max={1} step={0.01} sx={{mx:2, flex:1}} />
                                    <Typography>{Number(settings.top_p).toFixed(2)}</Typography>
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion expanded={expanded === 'structured'} onChange={handleAccordionChange('structured')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Structured Output</Typography>
                        </AccordionSummary>
                         <AccordionDetails>
                            <Stack spacing={2}>
                                <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography>Structured Output (JSON Schema)</Typography>
                                    <Switch checked={!!settings.structured_output_enabled}
                                            onChange={()=>setSettings(prev => ({...prev, structured_output_enabled: !prev.structured_output_enabled}))} />
                                </Box>
                                <TextField disabled={!settings.structured_output_enabled}
                                           multiline minRows={4}
                                           value={settings.structured_output_schema || ''}
                                           onChange={(e)=>setSettings(prev=>({...prev, structured_output_schema: e.target.value}))} />
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                     <Accordion expanded={expanded === 'option_storage'} onChange={handleAccordionChange('option_storage')}>
                           <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                           <Typography>Options storage </Typography>
                           </AccordionSummary>  
                           <AccordionDetails>
                             <Box>
                                <Typography>Select storage option:</Typography>
                                <RadioGroup sx={{display: 'flex', flexDirection: 'row'}} value={storageOption} onChange={(e)=>setStorageOption(e.target.value)}>
                                    <FormControlLabel value="local" control={<Radio />} label="Local Storage" />
                                    <FormControlLabel value="mixed" control={<Radio />} label="Mixed Only" />
                                </RadioGroup>
                             </Box>
                           </AccordionDetails>
                        </Accordion>
                </Stack>
            </DialogContent>
            <DialogActions className="config-dialog-actions">
                <Button className="config-close-btn" onClick={handleClose}>Close</Button>
                <Button className="config-save-btn" onClick={handleSave} variant="contained" color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfigurationDialog;