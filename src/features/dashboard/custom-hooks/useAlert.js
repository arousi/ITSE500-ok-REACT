import {createContext, useContext, useState} from 'react'

export const OpenAlertContext = createContext({});

export function OpenAlertProvider({children}) {

    const [alert , setAlert] = useState({state: false , type: "success" , title: "" , content: "" , action:"DEFAULT"});


    const showAlert = (state , type , title , content , action) => {
        setAlert({state:state , type , title , content , action});
    }
    const hideAlert = () => {
        setAlert({state: false , type: "success" , title: "" , content: "" , action:"DEFAULT"});
    }
    return (
        <OpenAlertContext.Provider value={{alert , showAlert , hideAlert}}>
            {children}
        </OpenAlertContext.Provider>
    );
}
export const  useAlert = () => {
    const context = useContext(OpenAlertContext);
    if(!context){
        throw new Error("useAlert must be used within a OpenAlertProvider");
    }
    return context;
}
