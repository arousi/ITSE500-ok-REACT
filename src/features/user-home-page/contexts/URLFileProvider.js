import {createContext} from "react";
import {useState} from "react";

export const URLFileContext = createContext(null);

export default  function URLFileProvider({children}) {
    const [filePath , setFilePath] = useState("");
    return(
        <URLFileContext.Provider value={{filePath , setFilePath}}>
            {children}
        </URLFileContext.Provider>
    )
}