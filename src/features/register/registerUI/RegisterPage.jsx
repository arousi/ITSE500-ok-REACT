
import {
    Avatar,
    Button,
    Card,
    CircularProgress,
    Divider,
    Typography,
} from "@mui/material";
import "../register-style.css";
import { useContext, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "../../settings/components/LanguageSwitcher";
import env from "../../../config/env";
import AuthButtons from "../components/AuthButtons";
import EmailField from "../components/EmailField";
import PasswordField from "../components/PasswordField";
import UserNameField from "../components/UserNameField";
import { RegisterContext } from "../contexts/RegisterContext";
import { useAuth } from "../contexts/UserProvider";
import { createNewUserAccount } from "../logic/connectServer";
import {
    readAnyVisitorAuthRow,
    readVisitorAuthRow,
    saveVisitorAuthRow,
} from "../../user-home-page/logic/connectIndexedDB";
import { VisitorLoggedInContext } from "../../login/contexts/visitorLoggedInContext";
import { associateDevice, visitorLogin, checkServerConnect } from "../../login/logic/connectServer";
import { checkRequiredRegisterData, validateEmail } from "../../dashboard/logic/validationData";
import { useToast } from "../../dashboard-auth/custom-hooks/useToast";
import { ThemeContext } from "../../settings/contexts/ThemeContext";
export default function RegisterPage() {
    const { t } = useTranslation();
    const { setAuth, setOperationType } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [userRegister, setUserRegister] = useState({
        username: "",
        email: "",
        user_password: "",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const visitorLoggedCtx = useContext(VisitorLoggedInContext);
    const { setTheme } = useContext(ThemeContext) || {};
    // Force light mode whenever user lands on register page (e.g., after logout)
    useEffect(() => {
        try { setTheme && setTheme("light"); } catch(_) {}
        try { document?.documentElement?.setAttribute('data-theme', 'light'); } catch(_) {}
    }, [setTheme]);
    // If the provider is not present (context is null), fall back to a noop setter
    const setVisitorLoggedIn = visitorLoggedCtx?.setVisitorLoggedIn ?? (() => {});

    const handleRegister = useCallback(async () => {
        if (checkRequiredRegisterData(userRegister)) {
            if (validateEmail(userRegister.email)) {
                try {
                    if (checkServerConnect().source === "local") {
                        showToast(t('login.errors.serverUnreachable'), "error");
                        setAuth(null);
                        setIsSubmitting(false);
                        return;
                    }
                    setIsSubmitting(true);

                    const newUser = await createNewUserAccount(userRegister);
                    if (newUser) {
                        setOperationType("REGISTER");
                        setAuth(newUser);
                        navigate("/dashboard/user-home-page/0");
                        // Reset all controlled fields (include password to avoid controlled->uncontrolled warnings)
                        setUserRegister({ username: "", email: "", user_password: "" });
                    }
                    setIsSubmitting(false);
                } catch (e) {
                    // Network-level error (axios) with no response
                    if (e?.isAxiosError && !e?.response) {
                        showToast(t('register.errors.connection'), "error");
                        setIsSubmitting(false);
                        return;
                    }
                    // Attempt to extract a meaningful message from various possible error shapes
                    const status = e?.response?.status;
                    const detail = e?.response?.data?.detail || e?.response?.data?.error || e?.response?.data?.message || e?.message || "Unknown error";

                    let friendly;
                    if (status === 400 && typeof detail === 'string' && /(exist|taken|already)/i.test(detail)) {
                        friendly = detail; // Backend already sent a useful duplication message
                    } else {
                        friendly = t('register.errors.failed');
                    }

                    setError(friendly);
                    setTimeout(() => { setError(""); }, 4000);
                    setIsSubmitting(false);
                }
            } else {
                setError("");
                setTimeout(() => {
                    setError(t('register.errors.invalidEmail'));
                }, 3000);
            }
        } else {
            setError(t('register.errors.fillAll'));
            setTimeout(() => {
                setError("");
            }, 3000);
        }
    }, [userRegister, setAuth, setOperationType, navigate, showToast]);

    const handleEnterPress = useCallback((e) => {
        if (e.key !== 'Enter') return;
        const order = [
            { id: 'usernameRegisterField', value: userRegister.username },
            { id: 'emailRegisterField', value: userRegister.email },
            { id: 'passwordRegisterField', value: userRegister.user_password },
        ];
        const empty = order.find(f => !f.value);
        if (empty) {
            e.preventDefault();
            document.getElementById(empty.id)?.focus();
            return;
        }
        handleRegister();
    }, [userRegister, handleRegister]);

    // Global key listener for Enter to ensure it works regardless of focused input (within the page)
    useEffect(() => {
        const handler = (e) => handleEnterPress(e);
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleEnterPress]);

    return (
        <RegisterContext.Provider value={{ userRegister, setUserRegister }}>
            <Card className={"register-card"}>
                <div id={"header"}>
                    <Avatar />
                    <LanguageSwitcher />
                    <Divider />
                </div>
                <div id={"body"}>
                    <UserNameField label={t('register.username')} />
                    <EmailField label={t('register.email')} />
                    <PasswordField label={t('register.password')} />
                    <Divider />
                    <label style={{ color: "red", fontSize: "20px" }}>{error}</label>
                </div>
                <div id={"footer"}>
                    <Button
                        onClick={handleRegister}
                        className={"register-buttons"}
                        variant={"contained"}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
                    >
                        {isSubmitting ? t('register.signingUp') : t('register.signUp')}
                    </Button>

                    <Typography className={"text"} variant={"h6"}>
                        {t('register.alreadyUser')}
                        <Typography
                            className={"text"}
                            variant={"h6"}
                            sx={{ textDecoration: "none" }}
                            component={Link}
                            to={"/login"}
                        >
                            {t('register.login')}
                        </Typography>
                    </Typography>

                    {env.enablePasswordReset && (
                    <Typography className={"text"} variant={"h6"}>
                        {t('login.forgotPassword')}
                        <Typography
                            className={"text"}
                            variant={"h6"}
                            sx={{ textDecoration: "none" }}
                            component={Link}
                            to={"/forgot-password"}
                        >
                            {t('login.resetNow')}
                        </Typography>
                    </Typography>
                    )}

                    <span style={{fontSize:"1.4em"}}>{t('common.or')}</span>

                    <Button
                        className={"guest-button"}
                        onClick={() => {
                            handleVisitorLogin();
                        }}
                        variant={"contained"}
                    >
                        {t('common.continueAsGuest')}
                    </Button>
                    <AuthButtons />
                </div>
            </Card>
        </RegisterContext.Provider>
    );


    async function handleVisitorLogin() {
        // 1) Try to restore existing guest session
        try {
            const storedId =
                typeof localStorage !== "undefined"
                    ? localStorage.getItem("visitor_id") || ""
                    : "";
            let existing = null;
            if (storedId) {
                try {
                    existing = await readVisitorAuthRow(storedId);
                } catch (_) {
                    existing = null;
                }
            }
            if (!existing) {
                try {
                    existing = await readAnyVisitorAuthRow();
                } catch (_) {
                    existing = null;
                }
            }
            if (existing && existing.data?.anon_id) {
                const visitorData = existing.data;
                setVisitorLoggedIn(visitorData);
                const visitorAuth = { data: visitorData };
                setAuth(visitorAuth);
                try {
                    await saveVisitorAuthRow(visitorAuth);
                } catch (_) {}
                try {
                    localStorage.setItem("visitor_id", visitorData.anon_id);
                } catch (_) {}
                try {
                    await associateDevice(visitorData.anon_id, visitorData.device_id);
                } catch (_) {}
                showToast(t('login.welcomeGuest'));
                navigate("/dashboard/user-home-page/0");
                return;
            }
        } catch (_) {
            /* ignore */
        }

        // 2) No existing session -> create new visitor
        const result = await visitorLogin();
        if (result?.source === "local") {
            showToast(t('login.serverOfflineGuest'));
        }
        if (result && result.data) {
            const visitorData = result.data;
            setVisitorLoggedIn(visitorData);
            const visitorAuth = { data: visitorData };
            setAuth(visitorAuth);
            try {
                await saveVisitorAuthRow(visitorAuth);
            } catch (_) {}
            try {
                localStorage.setItem("visitor_id", visitorData.anon_id);
            } catch (_) {}
            try {
                await associateDevice(visitorData.anon_id, visitorData.device_id);
            } catch (_) {}
            navigate("/dashboard/user-home-page/0");
        } else {
            showToast(t('login.guestUnable'));
        }
    }
}