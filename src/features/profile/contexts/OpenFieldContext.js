import { createContext , useState } from "react";

export const OpenFieldContext = createContext(); 

export function OpenFieldProvider({ children }) {
    const initialOpenFields = {
        firstNameField : false, 
        lastNameField : false, 
        phoneNumberField : false,
        userNameField : false
    }
   const [openFields, setOpenFields] = useState(initialOpenFields);

   return (
       <OpenFieldContext.Provider value={{ openFields, setOpenFields }}>
           {children}
       </OpenFieldContext.Provider>
   );
}

