import {Card, Typography  , Switch} from "@mui/material";
import "../settings-styles.css"
import {useContext} from "react";
import {ChatInferenceOptionContext} from "../contexts/ChatInferenceOptionContext";
export default function ChatInferenceOption() {

    const {chatInferenceOption , setChatInferenceOption} = useContext(ChatInferenceOptionContext);
    return(
        <>
          <Card className={"card"} id={"chat-inference-option-card"}>
              <Typography variant={"h3"}>Chat Inference Option</Typography>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.temperatureOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, temperatureOpen: !prev.temperatureOpen }))}
                  />
                  <Typography variant={"h5"}>Temperature</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.topKOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, topKOpen: !prev.topKOpen }))}
                  />
                  <Typography variant={"h5"}>Top k</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.minPOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, minPOpen: !prev.minPOpen }))}
                  />
                  <Typography variant={"h5"}>Min p</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.topPOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, topPOpen: !prev.topPOpen }))}
                  />
                  <Typography variant={"h5"}>Top p</Typography>
              </div>
              <div>
                  <Switch
                      checked={!!chatInferenceOption.repeatPenaltyOpen}
                      onChange={() => setChatInferenceOption(prev => ({ ...prev, repeatPenaltyOpen: !prev.repeatPenaltyOpen }))}
                  />
                  <Typography variant={"h5"}>Repeat Penalty</Typography>
              </div>
          </Card>
        </>
    );
}