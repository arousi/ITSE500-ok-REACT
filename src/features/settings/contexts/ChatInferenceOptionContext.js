import {createContext , useState} from 'react';

export const ChatInferenceOptionContext = createContext(null);

export function ChatInferenceOptionProvider({children}) {
    const initialChatInferenceOption = {
        temperatureOpen:false , topPOpen:false , topKOpen:false , repeatPenaltyOpen:false , minPOpen:false
    }
    const [chatInferenceOption , setChatInferenceOption] = useState(initialChatInferenceOption);
    return (
        <ChatInferenceOptionContext.Provider value={{chatInferenceOption , setChatInferenceOption}}>
            {children}
        </ChatInferenceOptionContext.Provider>
    );
}