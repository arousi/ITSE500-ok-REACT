import "../login-style.css"
import {Link , useNavigate} from "react-router-dom";
import {useState, useContext , useReducer, useEffect} from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../settings/components/LanguageSwitcher";
import AuthButtons from "../components/AuthButtons";
import {associateUserDevice, checkServerConnect, visitorLogin} from "../logic/connectServer";
import {useAuth} from "../../register/contexts/UserProvider";
import {useToast} from "../../dashboard-auth/custom-hooks/useToast";
import {ConversationContext} from "../../dashboard/contexts/ConversationContext";
// style already imported above
import profileReducer from "../../profile/logic/profileReducer";
import loginReducer from "../logic/loginReducer";
import { UserProfileContext } from "../../profile/contexts/UserProfileProvider";
import {Avatar, Button, Card, Divider, TextField, Typography, CircularProgress} from "@mui/material";
import {VisitorLoggedInContext} from "../contexts/visitorLoggedInContext";
//import {initialConversation} from "../../user-home-page/logic/connectAI";
import {associateDevice} from "../logic/connectServer";
import { saveUserAuthRow, saveVisitorAuthRow, readVisitorAuthRow, readAnyVisitorAuthRow } from "../../user-home-page/logic/connectIndexedDB";
import {v4 as uuidv4} from "uuid";
import { ThemeContext } from "../../settings/contexts/ThemeContext";
// Map raw/technical auth errors to i18n keys for safe, localized messages
// (never leak server internals or stack traces to the UI).
function friendlyLoginErrorKey(err) {
    const status = err?.response?.status;
    if (err?.code === 'ERR_NETWORK' || (err && !err.response && err.request)) {
        return 'login.errors.serverUnreachable';
    }
    if (status === 400 || status === 401) return 'login.errors.invalidCreds';
    if (status === 429) return 'login.errors.tooMany';
    return 'login.errors.generic';
}

export default function LoginPage() {
    const { t } = useTranslation();
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const [userLogin, setUserLogin] = useState({
        username: "",
        user_password: ""
    });
    const [, dispatchProfile] = useReducer(profileReducer, {});
    const [error, setError] = useState("");
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {showToast} = useToast();
    const { setConversationsList } = useContext(ConversationContext);
    const {setVisitorLoggedIn} = useContext(VisitorLoggedInContext);
    const {setUserProfile} = useContext(UserProfileContext);
    const { setTheme } = useContext(ThemeContext) || {};

    // Force light mode whenever user lands on login page (e.g., after logout)
    useEffect(() => {
        try { setTheme && setTheme("light"); } catch(_) {}
        // also update document directly as a safeguard
        try { document?.documentElement?.setAttribute('data-theme', 'light'); } catch(_) {}
    }, [setTheme]);

    return (

        <Card className={"login-card"}>
            <div id={"header"}>
                <Avatar/>
                <LanguageSwitcher/>
                <Divider/>
            </div>
            <div id={"body"}>
                <TextField
                    value={userLogin.username}
                    id={"usernameField"} label={t('login.username')}
                    onChange={(e) => setUserLogin({...userLogin, username: e.target.value})}
                    onKeyDown={handleEnterPress}
                />
                <TextField
                    value={userLogin.user_password}
                    id={"passwordField"} type={"password"}
                    onKeyDown={handleEnterPress}
                    label={t('login.password')} onChange={(e) => setUserLogin({...userLogin, user_password: e.target.value})}/>
                <Divider/>
                <label style={{color: "red", fontSize: "20px"}}>{error}</label>
            </div>
            <div id={"footer"}>
                
                <Button
                    id={"login-button"}
                    className={"buttons-login"}
                    onClick={handleLogin}
                    variant={"contained"}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
                >
                    {isSubmitting ? t('common.signingIn') : t('common.signIn')}
                </Button>
                <Typography className={"text"}>{t('login.newUser')} <Typography sx={{textDecoration: "none", fontSize: 20}}
                                                                      component={Link} to={"/register"}>{t('login.signUp')}</Typography></Typography>
                <Typography className={"text"} sx={{fontSize: 20}}>{t('login.forgotPassword')} <Typography sx={{textDecoration: "none", fontSize: 20}}
                                                                                              component={Link} to={"/forgot-password"}>{t('login.resetNow')}</Typography></Typography>
                <span style={{fontSize:"1.4em"}}>{t('common.or')}</span>
                <Button className={"guest-button"} sx={{textDecoration: "none"}} onClick={handleVisitorLogin} variant={"contained"}>{t('common.continueAsGuest')}</Button>
                <div className="auth-buttons">
                    <AuthButtons/>
                </div>
            </div>

        </Card>

    )

    async function handleLogin() {

        if (userLogin.username === "" || userLogin.user_password === "") {
            setError(t('login.errors.fillAll'));
            setTimeout(() => {
                setError("")
            }, 3000)
            setAuth(null);
        } else {
            const user = {
                username: userLogin.username,
                password: userLogin.user_password || userLogin.password || ''
            };
            setIsSubmitting(true);

            // Use the reducer-based login helper (returns {success, data, error})
            const result = await loginReducer({}, { type: 'LOGIN', payload: { newUser: user } });

            // network checks
            if (window.navigator.onLine === false) {
                showToast(t('login.errors.offline'), "error");
                setAuth(null);
                setIsSubmitting(false);
                return;
            }
            // checkServerConnect is still useful to detect unreachable auth service
            const serverCheck = await checkServerConnect();
            if (serverCheck.source === "local") {
                showToast(t('login.errors.serverUnreachable'), "error");
                setAuth(null);
                setIsSubmitting(false);
                return;
            }

            if (result.success && result.data) {
                const resp = result.data;
                const device_id = uuidv4();
                setAuth(resp);
                dispatchProfile({ type: "GET_PROFILE", payload: { auth: resp, setUserProfile } });
                try { await saveUserAuthRow(resp); } catch (_) {}
                try {
                    await associateUserDevice(resp.data.user_id, device_id, resp);
                } catch (e) { /* device association is best-effort */ }
                navigate("/dashboard/user-home-page/0");
                showToast(t('login.loginSuccess'));

                // restore local conversations saved in localStorage
                let i = 0;
                const conversationsListArray = [];
                while (i < localStorage.length) {
                    const key = localStorage.key(i);
                    if (key.includes("conversations")) {
                        const item = localStorage.getItem(key);
                        if (item) conversationsListArray.push(JSON.parse(item));
                    }
                    i++;
                }
                setConversationsList(conversationsListArray);
                setIsSubmitting(false);
            } else {
                const detail = t(friendlyLoginErrorKey(result.error));
                showToast(detail, "error");
                setError(detail);
                setTimeout(() => setError(""), 3000);
                setAuth(null);
                setIsSubmitting(false);
            }

        }

    }

    function handleEnterPress(e) {
        if (e.key !== 'Enter') return;
        // ترتيب الحقول المراد التحقق منها
        if (!userLogin.username) {
            e.preventDefault();
            document.getElementById('usernameField')?.focus();
            return;
        }
        if (!userLogin.user_password) {
            e.preventDefault();
            document.getElementById('passwordField')?.focus();
            return;
        }
        // كل الحقول ممتلئة، نفّذ تسجيل الدخول
        handleLogin();
    }
    async function handleVisitorLogin() {
        // 1) Try to restore an existing visitor session (device known)
        try {
            const storedId = typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '';
            let existing = null;
            if (storedId) {
                try { existing = await readVisitorAuthRow(storedId); } catch(_) { existing = null; }
            }
            if (!existing) {
                try { existing = await readAnyVisitorAuthRow(); } catch(_) { existing = null; }
            }
            if (existing && existing.data?.anon_id) {
                const visitorData = existing.data;
                setVisitorLoggedIn(visitorData);
                const visitorAuth = { data: visitorData };
                setAuth(visitorAuth);
                try { await saveVisitorAuthRow(visitorAuth); } catch(_) {}
                try { localStorage.setItem('visitor_id', visitorData.anon_id); } catch(_) {}
                try { await associateDevice(visitorData.anon_id, visitorData.device_id); } catch(_) {}
                showToast(t('login.welcomeGuest'));
                navigate('/dashboard/user-home-page/0');
                return;
            }
        } catch (_) { /* ignore and fallback to creating */ }

        // 2) No existing session: create new visitor (server if possible, else local)
        const result = await visitorLogin();
        if (result?.source === 'local') {
            showToast(t('login.serverOfflineGuest'));
        }
        if (result && result.data) {
            const visitorData = result.data;
            setVisitorLoggedIn(visitorData);
            const visitorAuth = { data: visitorData };

            setAuth(visitorAuth);
            try { await saveVisitorAuthRow(visitorAuth); } catch(_) {}
            try { localStorage.setItem('visitor_id', visitorData.anon_id); } catch(_) {}
            try { await associateDevice(visitorData.anon_id, visitorData.device_id); } catch(_) {}
            navigate('/dashboard/user-home-page/0');
        } else {
            showToast(t('login.guestUnable'));
        }
    }
}


