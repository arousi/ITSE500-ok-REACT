import {createContext , useState} from 'react';

export const ModelSelectedContext = createContext(null);

export function ModelSelectedProvider({children}) {
    const initialModelSelected = {
        name:"",
        provider:""
    }
    const [modelSelected , setModelSelected] = useState(initialModelSelected);
    return (
        <ModelSelectedContext.Provider value={{modelSelected , setModelSelected}}>
            {children}
        </ModelSelectedContext.Provider>
    );
}