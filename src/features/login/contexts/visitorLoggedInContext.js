import {createContext, useState} from 'react';

export const VisitorLoggedInContext = createContext(null);

export function VisitorLoggedInProvider({children}) {
    const [visitorLoggedIn , setVisitorLoggedIn] = useState(null);
    return (
        <VisitorLoggedInContext.Provider value={{visitorLoggedIn , setVisitorLoggedIn}}>
            {children}
        </VisitorLoggedInContext.Provider>
    )
}