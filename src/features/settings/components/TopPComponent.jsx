import {Card , Slider , Typography} from "@mui/material";
import {useContext} from 'react';
import "../settings-styles.css";
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
import logger from "../../../core/logger";
export default function TopPComponent() {
    const {settings , setSettings} = useContext(SettingsContext);
    const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <Card className={"card"} onClick={()=>{
            logger.debug('settings', settings);
        }}>
            <Typography sx={{fontSize:30}}>Top P</Typography>

            <h2>{settings.top_p}</h2>
        <Slider step={0.01}
            disabled={!chatInferenceOption.topPOpen}
            value={settings.top_p}
            min={0} max={1}
            onChange={handleTopPChange}
            valueLabelDisplay="auto"/>
            <p style={{fontSize:"18px"}}>Maximum base probability for a token to be selected for output</p>

        </Card>
    );
    function handleTopPChange(event) {
        setSettings(prev => ({
            ...prev,
            top_p: chatInferenceOption.topPOpen ? event.target.value : undefined
        }));
    }
}