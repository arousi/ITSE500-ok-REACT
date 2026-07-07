import { createContext , useState} from "react";

export const SystemPromptContext = createContext();

export const SystemPromptProvider = ({ children }) => {
    const [systemPrompt, setSystemPrompt] = useState('');

    return (
        <SystemPromptContext.Provider value={{ systemPrompt, setSystemPrompt }}>
            {children}
        </SystemPromptContext.Provider>
    );
};
