import {useContext} from "react";
import {validateEmail} from "../../dashboard/logic/validationData";
import {TextField} from "@mui/material";
import {RegisterContext} from "../contexts/RegisterContext";

export default function EmailField({label}) {
    const {userRegister , setUserRegister} = useContext(RegisterContext);
    const isError = userRegister.email && !validateEmail(userRegister.email);
    return (
        <TextField id={"emailRegisterField"}  value={userRegister.email}
                   onChange={(event)=>{
            setUserRegister({...userRegister, email: event.target.value});
        }} type={"email"}  error={!!isError}  label={label} />
    );
}