import {createContext , useState} from "react";
export const MessageRequestsContext = createContext(null);

export function MessageRequestsProvider({children}) {
    const [messageRequests, setMessageRequests] = useState([]);
    return (
        <MessageRequestsContext.Provider value={{messageRequests, setMessageRequests}}>
            {children}
        </MessageRequestsContext.Provider>
    );
}
