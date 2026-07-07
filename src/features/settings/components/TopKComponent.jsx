import {Card, Slider, Typography} from "@mui/material";
import {useContext} from "react";
import "../settings-styles.css"
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function TopKComponent() {
     const {settings , setSettings} = useContext(SettingsContext);
     const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <Card className={"card"}>
            <Typography sx={{fontSize:30}}>Top k</Typography>
            <h2>{settings.top_k}</h2>
        <Slider step={1}
            disabled={!chatInferenceOption.topKOpen}
            value={Number(settings.top_k) || 0}
            min={0} max={200}
            onChange={handleTopKChange}
            valueLabelDisplay="auto"/>
            <p style={{fontSize:"18px"}}>Minimum base probability for a token to be selected for output</p>
        </Card>

    )
    function handleTopKChange(event, newValue) {
        // MUI Slider passes value as the 2nd arg
        const val = Array.isArray(newValue) ? newValue[0] : Number(newValue ?? 0);
        if (!chatInferenceOption.topKOpen) return; // ignore when disabled
        setSettings(prev => ({ ...prev, top_k: val }));
    }

}