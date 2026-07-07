import {createContext , useState} from "react";
export const DisplayConfigurationContext = createContext(null);


export function DisplayConfigurationProvider({children}) {
   const [displayConfiguration, setDisplayConfiguration] = useState(false); 

   return(
         <DisplayConfigurationContext.Provider value={{displayConfiguration, setDisplayConfiguration}}>
            {children}
           
         </DisplayConfigurationContext.Provider>
   )
}