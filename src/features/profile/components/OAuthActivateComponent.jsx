import { Card, Typography } from "@mui/material";
import { UserProfileContext } from "../contexts/UserProfileProvider";
import { useContext } from "react";
import CustomSwitch from "./CustomSwitch";
import { startOAuth } from '../../auth/logic/oauthClient';
import profileReducer from "../logic/profileReducer";
import { useAuth } from "../../register/contexts/UserProvider";

export default function OAuthActivateComponent() {
    const { userProfile, setUserProfile } = useContext(UserProfileContext);
    const { auth, setAuth } = useAuth();

    async function refreshProfile() {
        try {
            await profileReducer({}, { type: 'GET_PROFILE', payload: { auth, setAuth, setUserProfile } });
        } catch (_) { /* ignore */ }
    }

    async function handleToggle(type, checked) {
        // optimistic update + link flow
        if (type === 'GOOGLE') {
            setUserProfile({ ...userProfile, is_google_user: checked });
            if (checked) {
                try {
                    await startOAuth('google', { window: 'popup', link: true, authToken: auth?.data?.access_token });
                    await refreshProfile();
                } catch (err) {
                    setUserProfile({ ...userProfile, is_google_user: false });
                    console.error('Google OAuth failed', err);
                }
            }
            return;
        }
        if (type === 'OPENROUTER') {
            setUserProfile({ ...userProfile, is_openrouter_user: checked });
            if (checked) {
                try {
                    await startOAuth('openrouter', { window: 'popup', link: true, authToken: auth?.data?.access_token });
                    await refreshProfile();
                } catch (err) {
                    setUserProfile({ ...userProfile, is_openrouter_user: false });
                }
            }
            return;
        }
    }

    return (
        <Card className={"oauth-card"}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                    <Typography sx={{ textAlign: 'left', fontSize: '23px', fontWeight: 'bold' }}>OpenRouter</Typography>
                    <p style={{ display: 'inline', textAlign: 'left', fontSize: "18px" }}>Enabled to show OpenRouter Sign-in on login screen</p> </div>
                <CustomSwitch checked={!!userProfile.is_openrouter_user}
                    onChange={(e) => handleToggle('OPENROUTER', e.target.checked)}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                    <Typography sx={{ textAlign: 'left', fontSize: '23px', fontWeight: 'bold' }}>Google</Typography>
                    <p style={{ display: 'inline', textAlign: 'left', fontSize: "18px" }}>Enabled to show Google Sign-in on login screen</p>             </div>
                <CustomSwitch checked={!!userProfile.is_google_user}
                    onChange={(e) => handleToggle('GOOGLE', e.target.checked)} type={'GOOGLE'} />
            </div>
            {/* Microsoft and GitHub are not supported at this time */}
        </Card>
    );
}
