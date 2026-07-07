import { createContext   , useState } from 'react';

export const DisabledComponentContext = createContext(false);


export function DisabledComponentProvider({ children }) {
   const [disabled , setDisabled] = useState(false);
  return (
    <DisabledComponentContext.Provider value={{disabled , setDisabled}}>
      {children}
    </DisabledComponentContext.Provider>
  );
}