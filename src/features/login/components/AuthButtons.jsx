import {Button , Box, Snackbar, Alert} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import LockIcon from '@mui/icons-material/Lock';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import GitHubIcon from '@mui/icons-material/GitHub';
// Removed useReducer and loginOAuthReducer; OAuth flow now only sets auth and navigates.
import { startOAuth, normalizeAuthPayload } from '../../auth/logic/oauthClient';
import { unifiedSync } from '../../../core/apiClient';
import { useAuth } from '../../register/contexts/UserProvider';
import { useState } from 'react';
import logger from '../../../core/logger';
import "../../login/login-style.css"
export default function AuthButtons() {
    // No reducer; just setAuth and navigate.
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    async function begin(provider) {
        if (loading) return; // prevent duplicate starts
        setLoading(true);
        try {
            const result = await startOAuth(provider, { window: 'popup' });
            logger.info('oauth', `[${provider}] OAuth succeeded`);
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
            } catch (_) { /* if hydration fails, keep token-only auth */ }
            setAuth(finalAuth);
            navigate('/dashboard/user-home-page/0');
        } catch (e) { logger.error('oauth', `[${provider}] OAuth failed`, e); }
        finally { setLoading(false); }
    }

    // Show user-facing toast on error
    function showError(err) {
        try {
            const msg = err?.message || String(err) || 'OAuth failed';
            setErrorMsg(msg);
        } catch (_) { setErrorMsg('OAuth failed'); }
    }

    const handleGoogleLoginButton = () => begin('google');
    const handleOpenRouterLoginButton = () => begin('openrouter');
    const handleMicrosoftLoginButton = () => begin('microsoft');
    const handleGitHubLoginButton = () => begin('github');

    return (
        <Box id={"auth-buttons"}>
            <Button disabled={loading} onClick={handleMicrosoftLoginButton}>
                <MicrosoftIcon sx={{ width: 30, height: 30, marginRight: 2 }} /> {loading ? 'Please wait…' : 'Continue with Microsoft'}
            </Button>
            <Button disabled={loading} onClick={handleOpenRouterLoginButton}>
                <LockIcon sx={{ width: 30, height: 30, marginRight: 2 }} /> {loading ? 'Please wait…' : 'Continue with OpenRouter'}
            </Button>
            <Button disabled={loading} onClick={handleGoogleLoginButton}>
                <GoogleIcon sx={{ width: 30, height: 30, marginRight: 2 }} /> {loading ? 'Please wait…' : 'Continue with Google'}
            </Button>
            <Button disabled={loading} onClick={handleGitHubLoginButton}>
                <GitHubIcon sx={{ width: 30, height: 30, marginRight: 2 }} /> {loading ? 'Please wait…' : 'Continue with GitHub'}
            </Button>
            <Snackbar open={Boolean(errorMsg)} autoHideDuration={8000} onClose={() => setErrorMsg(null)}>
                <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ width: '100%' }}>
                    {errorMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}