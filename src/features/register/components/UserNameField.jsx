import {useContext, useState} from "react";
import {RegisterContext} from "../contexts/RegisterContext";
import {TextField} from "@mui/material";

export default function UserNameField({label}) {
    const {userRegister , setUserRegister} = useContext(RegisterContext);
    const [checkError , setCheckError] = useState(false);
    return (
        <TextField id={"usernameRegisterField"}  value={userRegister.username}
                   onChange={(event)=>{
            setUserRegister({...userRegister, username: event.target.value});
        }} onKeyUp={()=>{
            if(userRegister.username === ""){
                setCheckError(true);
            }else{
                setCheckError(false);
            }
        }}  error={checkError}  label={label} />
    );

}