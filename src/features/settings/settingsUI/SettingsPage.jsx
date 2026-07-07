import ChatInferenceOption from "../components/ChatInferenceOption";
import '../settings-styles.css'
import {Button, Divider, Stack} from "@mui/material";
import TemperatureComponent from "../components/TemperatureComponent";
import TopKComponent from "../components/TopKComponent";
import MinPComponent from "../components/MinPComponent";
import RepeatPenalty from "../components/RepeatPenalty";
import TopPComponent from "../components/TopPComponent";
import Appearance from "../components/Appearance";
import {ChatInferenceOptionProvider} from "../contexts/ChatInferenceOptionContext";
import { useContext } from "react";
import { SettingsContext } from "../contexts/SettingsContext";
export default function SettingsPage() {
    const { settings, setSettings } = useContext(SettingsContext);
    const handleSave = () => {
        // Trigger persistence by updating settings (no-op merge)
        setSettings(prev => ({ ...prev, ...settings }));
    };
    return(
        <div id={"settings-page"}>
          <ChatInferenceOptionProvider>
              
              <ChatInferenceOption/>
              <Divider/>
            
              <TemperatureComponent/>
              <Divider/>
              <TopKComponent/>
              <Divider/>
              <MinPComponent/>
              <Divider/>
              <RepeatPenalty/>
              <Divider/>
              <TopPComponent/>
              <Divider/>
              <Appearance/>

          </ChatInferenceOptionProvider>
      <Stack direction="row" justifyContent="center" sx={{ mb: 1  , marginTop:1}}>
          <Button variant="contained"  sx={{ fontSize:30 , textTransform:"none" , fontWeight:"bold" , borderRadius:2 , width:"450px" , height:"56px"}} onClick={handleSave}>Save</Button>
           </Stack>
        </div>
    )
}