import {createContext , useState} from 'react';


export const MessageResponsesContext = createContext(null);

export function MessageResponsesProvider({children}) {
    const [messageResponses, setMessageResponses] = useState([]);
    return (
        <MessageResponsesContext.Provider value={{messageResponses, setMessageResponses}}>
            {children}
        </MessageResponsesContext.Provider>
    );
}
