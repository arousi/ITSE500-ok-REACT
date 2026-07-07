import {Card , Slider , Typography} from "@mui/material";
import {useContext} from 'react'
import { useTranslation } from "react-i18next";
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function MinPComponent(){
    const { t } = useTranslation();
    const {settings , setSettings} = useContext(SettingsContext);
    const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <Card className={"card"}>
            <Typography sx={{fontSize:30}}>{t('settingsPage.chatInference.minP')}</Typography>
            <h2>{settings.min_p}</h2>
            <Slider step={0.1}
                    disabled={!chatInferenceOption.minPOpen}
                    value={settings.min_p}
                    min={0} max={1}
                    onChange={handleMinPChange}
                    valueLabelDisplay="auto"/>
            <p style={{fontSize:"18px"}}>{t('settingsPage.chatInference.minPHelp')}</p>

        </Card>
    );
    function handleMinPChange(event) {
        setSettings(prev => ({
            ...prev,
            min_p: chatInferenceOption.minPOpen ? event.target.value : undefined
        }));
    }
}