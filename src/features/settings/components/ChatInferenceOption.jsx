import {Card, Typography  , Switch} from "@mui/material";
import "../settings-styles.css"
import {useContext} from "react";
import { useTranslation } from "react-i18next";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function ChatInferenceOption() {
    const { t } = useTranslation();
    const {chatInferenceOption , setChatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <>
          <Card className={"card"} id={"chat-inference-option-card"}>
              <Typography variant={"h3"}>{t('settingsPage.chatInference.title')}</Typography>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.temperatureOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, temperatureOpen: !prev.temperatureOpen }))}
                  />
                  <Typography variant={"h5"}>{t('settingsPage.chatInference.temperature')}</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.topKOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, topKOpen: !prev.topKOpen }))}
                  />
                  <Typography variant={"h5"}>{t('settingsPage.chatInference.topK')}</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.minPOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, minPOpen: !prev.minPOpen }))}
                  />
                  <Typography variant={"h5"}>{t('settingsPage.chatInference.minP')}</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.topPOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, topPOpen: !prev.topPOpen }))}
                  />
                  <Typography variant={"h5"}>{t('settingsPage.chatInference.topP')}</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.repeatPenaltyOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, repeatPenaltyOpen: !prev.repeatPenaltyOpen }))}
                  />
                  <Typography variant={"h5"}>{t('settingsPage.chatInference.repeatPenalty')}</Typography>
              </div>
          </Card>
        </>
    );
}