import {createContext} from 'react'; 
import {useState} from 'react';

export const MessagesContext = createContext(null);

export function MessagesProvider({children}) {
    const [messages, setMessages] = useState([]);
    return (
        <MessagesContext.Provider value={{messages, setMessages}}>
            {children}
        </MessagesContext.Provider>
    );
}