import { TextField, InputAdornment, IconButton } from "@mui/material";
import { useContext } from "react";
import {Phone ,Edit , HighlightOff} from "@mui/icons-material"
import {UserProfileContext} from "../contexts/UserProfileProvider";
import {validatePhone} from "../../dashboard/logic/validationData";
import { OpenFieldContext } from "../contexts/OpenFieldContext";
import { useAuth } from "../../register/contexts/UserProvider";
export default function PhoneNumberField({ label }) {
    const { auth } = useAuth();
    const { setUserProfile, userProfile } = useContext(UserProfileContext);
    let isError = false ;
    if(userProfile){
        isError = userProfile.phone_number && !validatePhone(userProfile.phone_number);
    }
    const { openFields, setOpenFields } = useContext(OpenFieldContext);
    return (
        <TextField
            className={"text-field"}
            fullWidth
            disabled={!openFields.PhoneNumberField}
            value={userProfile ? userProfile.phone_number : ""}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Phone sx={{ width: 24, height: 24 }} />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => setOpenFields({ ...openFields, PhoneNumberField: !openFields.PhoneNumberField })}
                            disabled={!auth?.data?.refresh_token}
                        >
                            {auth?.data?.refresh_token ? (
                                <Edit sx={{ width: 30, height: 30 }} />
                            ) : (
                                <HighlightOff sx={{ width: 30, height: 30 }} />
                            )}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            autoFocus={openFields.PhoneNumberField}
            onChange={(event) => setUserProfile({ ...userProfile, phone_number: event.target.value })}
            error={!!isError}
            variant={'outlined'}
            label={label}
        />
    );
}
