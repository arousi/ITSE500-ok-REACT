import {Card , Radio  , RadioGroup , Typography , FormControlLabel} from "@mui/material";
import "../settings-styles.css"
import { useContext } from "react";
import { LanguageContext } from "../contexts/LanguageContext";
import { ThemeContext } from "../contexts/ThemeContext";

export default function Appearance() {
    const { language, setLanguage } = useContext(LanguageContext);
    const { theme, setTheme } = useContext(ThemeContext);
    return(
        <Card    className={"card"}>
            <Typography sx={{fontSize:30}}>Appearance</Typography>
            <RadioGroup defaultValue={"default"} value={theme} onChange={(e) => setTheme(e.target.value)} className={"radio-group"}>
                <FormControlLabel value={"light"} control={<Radio />} label={<Typography sx={{fontSize:20}}>Light mode</Typography>} />
                <FormControlLabel value={"default"} control={<Radio />} label={<Typography sx={{fontSize:20}}>System default</Typography>} />
                <FormControlLabel value={"dark"} control={<Radio />} label={<Typography sx={{fontSize:20}}>Dark mode</Typography>} />
            </RadioGroup>
            
        </Card>
    )
}