import {Card , Slider  , Typography } from "@mui/material";
import {useContext} from 'react';
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function RepeatPenalty() {
    const {settings , setSettings} = useContext(SettingsContext);
    const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <Card className={"card"}>

            <Typography sx={{fontSize:30}}>Repeat penalty</Typography>
            <h2>{settings.repeat_penalty}</h2>
            <Slider step={0.01}
                    disabled={!chatInferenceOption.repeatPenaltyOpen}
                    value={settings.repeat_penalty}
                    min={1.05} max={1.2}
                    onChange={handleRepeatPenaltyChange}
                    valueLabelDisplay="auto"/>
            <p style={{fontSize:"18px"}}>How much to discourage repeating the same token</p>

        </Card>
    )
    function handleRepeatPenaltyChange(event) {
        setSettings(prev => ({
            ...prev,
            repeat_penalty: chatInferenceOption.repeatPenaltyOpen ? event.target.value : undefined
        }));
    }
}