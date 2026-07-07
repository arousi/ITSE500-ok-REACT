import {createContext, useState} from 'react';

export const LLMsProviderTypeContext = createContext(null);

export function LLMsProviderTypeProvider({ children }) {
    const [providerType, setProviderType] = useState("");
  return <LLMsProviderTypeContext.Provider value={{providerType , setProviderType}}>{children}</LLMsProviderTypeContext.Provider>;
}