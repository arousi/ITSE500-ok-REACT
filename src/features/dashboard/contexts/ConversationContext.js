import {createContext, useContext, useEffect, useState} from "react";
import {useAuth} from "../../register/contexts/UserProvider";
export const ConversationContext = createContext([]);

export function ConversationProvider({children}) {
    const [conversationsList, setConversationsList] = useState([]);

    return(
        <ConversationContext.Provider  value={{conversationsList, setConversationsList}}>
            {children}
        </ConversationContext.Provider>
    )
}