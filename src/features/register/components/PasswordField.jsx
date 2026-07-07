
import { useContext } from "react";
import { TextField } from "@mui/material";
import { RegisterContext } from "../contexts/RegisterContext";
export default function PasswordField({label }) {
     const {userRegister , setUserRegister} = useContext(RegisterContext);
    return (
        <TextField id={"passwordRegisterField"}  value={userRegister.user_password}
                   onChange={(event)=>{
            setUserRegister({...userRegister, user_password: event.target.value});
        }} type={"password"}  label={label} />
    );
}