import {createContext , useState} from 'react'

export const MessageOutputsContext = createContext(null);

export function MessageOutputsProvider({children}) {
    const [messageOutputs, setMessageOutputs] = useState([]);
    return (
        <MessageOutputsContext.Provider value={{messageOutputs, setMessageOutputs}}>
            {children}
        </MessageOutputsContext.Provider>
    );
}
