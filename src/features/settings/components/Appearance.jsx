import {Card , Radio  , RadioGroup , Typography , FormControlLabel} from "@mui/material";
import "../settings-styles.css"
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { LanguageContext } from "../contexts/LanguageContext";
import { ThemeContext } from "../contexts/ThemeContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Appearance() {
    const { t } = useTranslation();
    const { language, setLanguage } = useContext(LanguageContext);
    const { theme, setTheme } = useContext(ThemeContext);
    return(
        <Card    className={"card"}>
            <Typography sx={{fontSize:30}}>{t('settingsPage.appearance.title')}</Typography>
            <RadioGroup defaultValue={"default"} value={theme} onChange={(e) => setTheme(e.target.value)} className={"radio-group"}>
                <FormControlLabel value={"light"} control={<Radio />} label={<Typography sx={{fontSize:20}}>{t('settingsPage.appearance.lightMode')}</Typography>} />
                <FormControlLabel value={"default"} control={<Radio />} label={<Typography sx={{fontSize:20}}>{t('settingsPage.appearance.systemDefault')}</Typography>} />
                <FormControlLabel value={"dark"} control={<Radio />} label={<Typography sx={{fontSize:20}}>{t('settingsPage.appearance.darkMode')}</Typography>} />
            </RadioGroup>
            <Typography sx={{fontSize:20, marginTop:2}}>{t('settings.language')}</Typography>
            <LanguageSwitcher/>
        </Card>
    )
}