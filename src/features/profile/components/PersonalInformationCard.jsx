import { Card, Typography, TextField, Button, IconButton, Stack, Divider } from "@mui/material";
import { Person, Edit, ContentCopy, HighlightOff, AlternateEmail, Phone } from "@mui/icons-material";
import { OpenFieldContext } from "../contexts/OpenFieldContext";
import { InputAdornment } from "@mui/material";
import profileReducer from "../logic/profileReducer";
import EmailField from "./EmailField";
import { useContext, useReducer, useState, useEffect } from "react";
import { useAuth } from "../../register/contexts/UserProvider";
import PhoneNumberField from "./PhoneNumberField";
import "../profile-styles.css"
import { UserProfileContext } from "../contexts/UserProfileProvider";
import { useToast } from "../../dashboard-auth/custom-hooks/useToast";
import { useTranslation } from "react-i18next";
export default function PersonalInformationCard() {
    const { t } = useTranslation();
    const { auth } = useAuth();
    const { openFields, setOpenFields } = useContext(OpenFieldContext);
    const initialState = {
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone_number: ""
    }
    // removed unused focused state
    const [error, setError] = useState("");
    const [/* _state */, dispatch] = useReducer(profileReducer, initialState);
    const { userProfile, setUserProfile } = useContext(UserProfileContext)
    const { showToast } = useToast();
    useEffect(() => {
        if (error) {
            showToast(error, 'error');

        }
    }, [error, showToast]);
    return (
        <Card id={"personal-information-card"} sx={{ p: 3, borderRadius: 3 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>{t('profile.personalInformation')}</Typography>

            <Stack spacing={1} direction="row" className={"username-server-uuid"}>
                    <div style={{ flex: '1 1 0', minWidth: 0 }} sx={{ flexWrap: 'nowrap', alignItems: 'stretch' }}>
                    <TextField className={'text-field'}
                        fullWidth
                        value={auth.data.refresh_token ? userProfile.username : auth.data.anon_id}
                        onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Person sx={{ width: 24, height: 24 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={(e) => {
                                        setOpenFields({ ...openFields, userNameField: !openFields.userNameField });
                                    }} disabled={auth?.data?.refresh_token ? false : true}>
                                        {auth?.data?.refresh_token ? <Edit sx={{ width: 30, height: 30 }} /> : <HighlightOff sx={{ width: 30, height: 30 }} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        variant={'outlined'}
                        autoFocus={openFields.userNameField}
                        disabled={!openFields.userNameField}
                        label={t('profile.username')}
                    />
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <TextField
                        className={'text-field'}
                        fullWidth
                        value={auth.data.user_id ? auth.data.user_id : auth.data.anon_id}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton aria-label="copy id">
                                        <ContentCopy sx={{ width: 24, height: 24 }} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            readOnly: true
                        }}
                        variant={'outlined'}
                        label={t('profile.serverUuid')}
                    />
                </div>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <div className={"email-phone"}>
                <EmailField label={t('profile.email')} icon={<AlternateEmail />} />
                        <Divider sx={{ my: 2 }} />
                <PhoneNumberField label={t('profile.phoneNumber')} icon={<Phone />} />
                {auth?.data?.refresh_token ? (
                    <>
                        <TextField className={"text-field"}
                            value={userProfile?.first_name}
                            onChange={(e) => setUserProfile({ ...userProfile, first_name: e.target.value })}
                            variant={'outlined'}
                            fullWidth
                            label={t('profile.firstName')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={(e) => {
                                            setOpenFields({ ...openFields, firstNameField: !openFields.firstNameField });
                                        }}>
                                            <Edit sx={{ width: 30, height: 30 }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            autoFocus={openFields.firstNameField}
                            disabled={!openFields.firstNameField}
                        />
                        <TextField className={"text-field"}
                            value={userProfile?.last_name}

                            onChange={(e) => setUserProfile({ ...userProfile, last_name: e.target.value })}
                            variant={'outlined'}
                            fullWidth
                            label={t('profile.lastName')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={(e) => {
                                            setOpenFields({ ...openFields, lastNameField: !openFields.lastNameField });
                                        }}>
                                            {auth?.data?.refresh_token ? <Edit sx={{ width: 30, height: 30 }} /> : <HighlightOff sx={{ width: 30, height: 30 }} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            autoFocus={openFields.lastNameField}
                            disabled={!openFields.lastNameField}
                        />
                    </>
                ) : null}
            </div>
            <div id={'personal-card-footer'}>
                <Button onClick={handleUpdateProfileButton} disabled={auth?.data?.refresh_token ? false : true} variant={"contained"} sx={{ width: "90%" }}>
                    {t('profile.saveAllChanges')}
                </Button>
            </div>
        </Card>
    );

    function handleUpdateProfileButton() {
        const userUpdated = {
            username: userProfile.username,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            email: userProfile.email,
            phone_number: userProfile.phone_number,
            is_openrouter_user: userProfile.is_openrouter_user,
            is_google_user: userProfile.is_google_user
        };
        dispatch({ type: 'UPDATE_PROFILE', payload: { userUpdated, auth, setError, showToast } });
    }


}


