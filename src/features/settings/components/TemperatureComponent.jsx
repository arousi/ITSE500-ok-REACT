import {Card , Slider , Typography} from "@mui/material";
import {useContext} from "react";
import "../settings-styles.css"
import {SettingsContext} from "../contexts/SettingsContext";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function TemperatureComponent() {
    const {settings , setSettings} = useContext(SettingsContext);
    const {chatInferenceOption} = useContext(ChatInferenceOptionContext);
     return(
         <Card className={"card"}>
             <Typography sx={{fontSize:30}}>Temperature</Typography>
             <h2>{settings.temperature}</h2>
             <Slider step={0.01}
                     disabled={!chatInferenceOption.temperatureOpen}
                     value={settings.temperature}
                     min={0} max={1}
                     onChange={(e)=>{
                         setSettings({...settings , temperature: e.target.value});
                     }}
                     valueLabelDisplay="auto"/>
             <p style={{fontSize:"18px"}}>How much randomness to introduce. 0 will yield the same result every time, while higher values will increase creativity and variance</p>
         </Card>
     )
}