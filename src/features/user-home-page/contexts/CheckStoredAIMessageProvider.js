import {IsStoredAIMessageContext} from './IsStoredAIMessageContext'
import {useState} from "react";
export default function CheckStoredAIMessageProvider({children})

{
    const [isStoredMessage , setIsStoredMessage] = useState(false);

    return(
        <IsStoredAIMessageContext.Provider value={{isStoredMessage , setIsStoredMessage}}>
            {children}
        </IsStoredAIMessageContext.Provider>
    )
}