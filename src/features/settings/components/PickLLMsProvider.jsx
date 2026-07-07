import {
    Card,
    Accordion,
    Radio,
    Typography,
    AccordionDetails,
    RadioGroup,
    AccordionSummary,
    Divider
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import "../settings-styles.css"
import {useContext, useState} from "react";
import {LLMsProviderTypeContext} from "../contexts/LLMsProviderTypeContext";

export default function  PickLLMsProvider() {
    const {setProviderType} = useContext(LLMsProviderTypeContext);
    return (
        <Card className={"card"} id={"pick-LLMs-card"}>

                <Accordion
                            aria-controls="panel1-content"
                            id="panel1-header">
                    <AccordionSummary expandIcon={<ExpandMore id={"expandIcon"} />}
                                      aria-controls="panel1-content"
                                      id="panel1-header">
                        <Typography variant={"h3"}>Default provider:</Typography>
                    </AccordionSummary>
                    <AccordionDetails >
                        <RadioGroup
                          defaultValue={"https://api.openrouter.dev/v1/chat/completions"}
                         className={"radio-group"}
                        >
                            <div>
                                <Radio onChange={(e)=>{
                                    setProviderType(e.target.value);
                                }} value={"OPEN_ROUTER"}/>
                                <Typography variant={"h5"}>OpenRouter</Typography>
                                <Divider/>
                            </div>
                            <div>
                                <Radio onChange={(e)=>{
                                    setProviderType(e.target.value);
                                }} value={"GOOGLE_AI_STUDIO"}/>
                                <Typography variant={"h5"}>Google ai studio</Typography>
                                <Divider/>
                            </div>
                            <div>
                                <Radio onChange={(e)=>{
                                    setProviderType(e.target.value);
                                }} value={"OPENAI"}/>
                                <Typography variant={"h5"}>OpenAI</Typography>
                                <Divider/>
                            </div>
                            <div>
                                <Radio onChange={(e)=>{
                                    setProviderType(e.target.value);
                                }} value={"LM_STUDIO"}/>
                                <Typography variant={"h5"}>LM-Studio</Typography>
                                <Divider/>
                            </div>
                        </RadioGroup>

                    </AccordionDetails>
                </Accordion>
        </Card>
    )
}