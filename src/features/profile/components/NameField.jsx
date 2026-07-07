import {useContext, useState} from "react";
import {UserProfileContext} from "../contexts/UserProfileProvider";
import {TextField , InputAdornment} from "@mui/material";
import {Edit} from "@mui/icons-material"
import {DisabledComponentContext} from "../../dashboard/contexts/DisabledComponentContext";
export default function NameField({type , label , auth}) {
    const {userProfile , setUserProfile} = useContext(UserProfileContext);
    const [checkError , setCheckError] = useState(false);
    let nameSelected = "";
    if(userProfile){
        nameSelected = type === "FIRST_NAME" ? userProfile.first_name : type === "USERNAME" ? userProfile.username : userProfile.last_name ;

    }
    const {disabled} = useContext(DisabledComponentContext);
    return (
        <TextField id={"emailField"} disabled={disabled}  value={nameSelected}
                   InputProps={{
                       endAdornment: (
                           <InputAdornment position="end">
                               <Edit />
                           </InputAdornment>
                       ),
                   }}
                   onChange={(event)=>{
            if(type === "FIRST_NAME"){
                setUserProfile({...userProfile, first_name: event.target.value});
            }else if(type === "USERNAME"){
                if(auth.data.user_id){
                    setUserProfile({...userProfile, username: event.target.value});
                }else if(auth.data.anon_id){
                    setUserProfile({...userProfile, username: event.target.value});
                }
                setUserProfile({...userProfile, username: event.target.value});
            }else{
                setUserProfile({...userProfile, last_name: event.target.value});
            }
        }} onKeyUp={()=>{
            if(label === "First name"){
                if(userProfile.first_name === ""){
                    setCheckError(true);
                }else{
                    setCheckError(false);
                }

            }else{
                if(userProfile.last_name === ""){
                    setCheckError(true);
                }else{
                    setCheckError(false);
                }

            }

        }} type={"email"} error={!!checkError}  label={label} />
    );
}