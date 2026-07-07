import { TextField, InputAdornment } from "@mui/material";
import { Email } from "@mui/icons-material";
import { useContext } from "react";
import {validateEmail} from "../../dashboard/logic/validationData";
import {UserProfileContext} from "../contexts/UserProfileProvider";
import "../profile-styles.css"
import {DisabledComponentContext} from "../../dashboard/contexts/DisabledComponentContext";
export default function EmailField({ label }) {
    useContext(DisabledComponentContext);
    const { userProfile, setUserProfile } = useContext(UserProfileContext);
    let isError = false ;
    if(userProfile){
         isError = userProfile.email && !validateEmail(userProfile.email);
    }



    return (
       <>
           <TextField
               className={"text-field"}
               id={"emailField"}
               fullWidth
               value={userProfile ? userProfile.email : ""}
               onChange={(event) => setUserProfile({ ...userProfile, email: event.target.value })}
               type={"email"}
               error={!!isError}
               InputProps={{
                   startAdornment: (
                       <InputAdornment position="start">
                           <Email sx={{ width: 24, height: 24 }} />
                       </InputAdornment>
                   ),
                   readOnly: true,
               }}
               disabled
               label={label}
               variant={'outlined'}
           />
       </>

    );


}