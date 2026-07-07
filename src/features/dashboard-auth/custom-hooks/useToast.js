import {createContext , useState , useContext} from 'react';

const ToastContext = createContext(null);


export function ToastProvider({children}){
    const [toast, setToast] = useState({open:false , content:'' , type:'success'});
    const  showToast = (content , type) =>{
        setToast({...toast  , open:true , content:content,type:type});
    }
    const  closeToast = () =>{
        setToast({...toast , open:false , content:"",type:"success"});
    }
    return(
        <ToastContext.Provider value={{toast , showToast , closeToast}}>
            {children}
        </ToastContext.Provider>
    )

}

export function useToast(){
    const context = useContext(ToastContext);
    if(!context){
        throw new Error('useToast must be used within an OpenAlert context');
    }else{
        return context;
    }
}