import {Card , Slider , Typography} from "@mui/material";
import {useContext} from 'react'
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function MinPComponent(){
    const {settings , setSettings} = useContext(SettingsContext);
    const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <Card className={"card"}>
            <Typography sx={{fontSize:30}}>Min p</Typography>
            <h2>{settings.min_p}</h2>
            <Slider step={0.1}
                    disabled={!chatInferenceOption.minPOpen}
                    value={settings.min_p}
                    min={0} max={1}
                    onChange={handleMinPChange}
                    valueLabelDisplay="auto"/>
            <p style={{fontSize:"18px"}}>Minimum base probability for a token to be selected for output</p>

        </Card>
    );
    function handleMinPChange(event) {
        setSettings(prev => ({
            ...prev,
            min_p: chatInferenceOption.minPOpen ? event.target.value : undefined
        }));
    }
}