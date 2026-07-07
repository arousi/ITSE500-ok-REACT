import {createContext, useState} from 'react';
import {useParams} from 'react-router-dom'

export const SendMessageContext = createContext(null);

export function SendMessageProvider({children}) {
   // const {conversationId} = useParams();
  //  let initialMessages = JSON.parse(localStorage.getItem(`conversations${conversationId}`)) || [];

    const [messages, setMessages] = useState([]);
    const [contents , setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <SendMessageContext.Provider value={{messages, setMessages , contents , setContents, isLoading, setIsLoading}}>
            {children}
        </SendMessageContext.Provider>
    )
}

