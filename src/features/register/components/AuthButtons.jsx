import {Button , Box} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import LockIcon from '@mui/icons-material/Lock';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import GitHubIcon from '@mui/icons-material/GitHub';
// Removed useReducer and registerOAuthReducer; OAuth flow now only sets auth and navigates.
import { startOAuth, normalizeAuthPayload } from '../../auth/logic/oauthClient';
import { unifiedSync } from '../../../core/apiClient';
import { useState } from 'react';
import { useAuth } from '../../register/contexts/UserProvider';
import logger from '../../../core/logger';

    export default function AuthButtons() {
        // No reducer; just setAuth and navigate.
        const { setAuth } = useAuth();
        const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

        async function begin(provider) {
            if (loading) return;
            setLoading(true);
            try {
                const result = await startOAuth(provider, { window: 'popup' });
                // Normalize and hydrate profile to ensure user_id is present
                const baseAuth = normalizeAuthPayload(result);
                const access = baseAuth?.data?.access_token || baseAuth?.access_token || '';
                let finalAuth = baseAuth;
                try {
                    const resp = await unifiedSync.getMe({ profile: true, chat: false }, access || undefined);
                    const profile = resp?.data?.profile || resp?.data || resp;
                    const user_id = profile?.user_id || profile?.id || baseAuth?.data?.user_id || baseAuth?.user_id;
                    if (user_id) {
                        finalAuth = { data: { ...baseAuth.data, user_id, access_token: access || baseAuth?.data?.access_token, refresh_token: baseAuth?.data?.refresh_token } };
                    }
                } catch (_) { /* ignore hydration failures */ }
                setAuth(finalAuth);
                navigate('/dashboard/user-home-page/0');
            } catch (e) { logger.error('oauth', `[${provider}] OAuth failed`, e); }
            finally { setLoading(false); }
        }

        const handleGoogleRegButton = () => begin('google');
        const handleMicrosoftRegButton = () => begin('microsoft');
        const handleOpenRouterRegButton = () => begin('openrouter');
        const handleGitHubRegButton = () => begin('github');

        return (
            <Box className={"auth-buttons"}>
                <Button disabled={loading} onClick={handleMicrosoftRegButton}><MicrosoftIcon sx={{width: 30, height: 30 , marginRight:2}}/> {loading ? 'Please wait…' : 'Continue with Microsoft'}</Button>
                <Button disabled={loading} onClick={handleOpenRouterRegButton}><LockIcon sx={{width: 30, height: 30 , marginRight:2}}/> {loading ? 'Please wait…' : 'Continue with OpenRouter'}</Button>
                <Button disabled={loading} onClick={handleGoogleRegButton}><GoogleIcon sx={{width: 30, height: 30 , marginRight:2}}/> {loading ? 'Please wait…' : 'Continue with Google'}</Button>
                <Button disabled={loading} onClick={handleGitHubRegButton}><GitHubIcon sx={{width: 30, height: 30 , marginRight:2}}/> {loading ? 'Please wait…' : 'Continue with GitHub'}</Button>
            </Box>
        );
    }