import ChatField from "../Components/ChatField";
import ChatArea from "../Components/ChatArea";
import {Box} from "@mui/material";
import CheckStoredAIMessageProvider from "../contexts/CheckStoredAIMessageProvider";
import "../home.css"
import URLFileProvider from "../contexts/URLFileProvider";
import {FileProvider} from "../contexts/FileProvider";
import {ModelSelectedProvider} from "../contexts/ModelSelectedContext";
export default function UserHomePage() {

    return (
            <CheckStoredAIMessageProvider>
                <ModelSelectedProvider>
                    <FileProvider>
                        <URLFileProvider >
                            <Box className="chat-area-container" >
                                <ChatArea/>
                                <ChatField/>
                            </Box>
                        </URLFileProvider>
                    </FileProvider>
                </ModelSelectedProvider>
            </CheckStoredAIMessageProvider>
    );

}