import {createContext , useState} from 'react'

export const OptionStorageContext = createContext(null);

export const OptionStorageProvider = ({ children }) => {
  const [storageOption, setStorageOption] = useState("local");

  return (
    <OptionStorageContext.Provider value={{ storageOption, setStorageOption }}>
      {children}
    </OptionStorageContext.Provider>
  );
};
