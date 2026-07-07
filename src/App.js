import {Routes, Route, Navigate} from "react-router-dom";
import UserHomePage from  './features/user-home-page/UserPage/UserHomePage'
import Dashboard from "./features/dashboard/dashboardUI/Dashboard";
import ProfilePage from "./features/profile/profileUI/ProfilePage";
import HistoryPage from "./features/history/historyUI/HistoryPage";
import ForgotPasswordPage from "./features/forgot-password/forgot-pages/ForgotPasswordPage";
import SettingsPage from "./features/settings/settingsUI/SettingsPage";
import UserProvider from "./features/register/contexts/UserProvider";
import RequireAuth from "./features/dashboard-auth/Components/RequireAuth";
import {ToastProvider} from "./features/dashboard-auth/custom-hooks/useToast";
import LoginPage from "./features/login/loginUI/LoginPage";
import RegisterPage from "./features/register/registerUI/RegisterPage";
import AuthLayout from "./features/dashboard-auth/dashboard-authUI/AuthLayout";
import RegisterOTPPage from "./features/register-OTP/registerOTP-UI/RegisterOTPPage";
import {ConversationProvider} from "./features/dashboard/contexts/ConversationContext";
import Toast from "./features/dashboard-auth/Components/Toast";
import { MessageResponsesProvider } from "./features/user-home-page/contexts/MessageResponsesContext";
import { MessageRequestsProvider } from "./features/user-home-page/contexts/MessageRequestsContext";
import { MessagesProvider } from "./features/user-home-page/contexts/MessagesContext";
import { MessageOutputsProvider } from "./features/user-home-page/contexts/MessageOutputsContext";
import { DisabledComponentProvider } from "./features/dashboard/contexts/DisabledComponentContext";
import UserProfileProvider from "./features/profile/contexts/UserProfileProvider";
import { useContext } from "react";
import { useLocation } from 'react-router-dom';
import { ThemeContext } from "./features/settings/contexts/ThemeContext";
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { buildMuiThemes } from './features/settings/theme/palette';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { LanguageContext } from './features/settings/contexts/LanguageContext';
import { isRtlLang } from './i18n';
// Emotion caches: RTL cache runs stylis-plugin-rtl so MUI components flip in Arabic.
const emotionCacheLtr = createCache({ key: 'mui', stylisPlugins: [prefixer] });
const emotionCacheRtl = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });

function App() {
    const { effectiveTheme } = useContext(ThemeContext) || {};
    const { language } = useContext(LanguageContext) || {};
    const location = useLocation();
    // Auth pages should always be light
    const isAuthRoute = /^(\/|\/login|\/register|\/register-otp|\/forgot-password)$/.test(location.pathname);
    const paletteMode = isAuthRoute ? 'light' : (effectiveTheme === 'dark' ? 'dark' : 'light');
    const direction = isRtlLang(language) ? 'rtl' : 'ltr';
    const muiTheme = createTheme({ ...buildMuiThemes(paletteMode), direction });

    return (
    <CacheProvider value={direction === 'rtl' ? emotionCacheRtl : emotionCacheLtr}>
    <MuiThemeProvider theme={muiTheme}>
    <CssBaseline />
    <div className="App" style={{ minHeight: '100vh', backgroundColor: muiTheme.palette.background.default, color: muiTheme.palette.text.primary }}>
                    <UserProvider>
              <ToastProvider>
                <UserProfileProvider>
                     <DisabledComponentProvider>
                      <ConversationProvider>
                        <MessageOutputsProvider>
                            <MessagesProvider>
                                <MessageRequestsProvider>
                                    <MessageResponsesProvider>
                                        <Routes>
                                            <Route path="/" element={<AuthLayout/>}>
                                                <Route index element={<Navigate to="login" replace />} />
                                                <Route path="register" element={<RegisterPage/>}/>
                                                <Route path="login" element={<LoginPage/>}/>
                                                <Route path="register-otp" element={<RegisterOTPPage/>}/>
                                                <Route path={"forgot-password"} element={<ForgotPasswordPage/>} />
                                            </Route>
                                            <Route element={<RequireAuth/>}>
                                                <Route path={"/dashboard"} element={<Dashboard/>} >
                                                    <Route path={"user-home-page/:conversationId"} element={<UserHomePage/>} />
                                                    <Route path={"profile"} element={<ProfilePage/>} />
                                                    <Route path={"history"} element={<HistoryPage/>}/>
                                                    <Route path={"settings"}  element={<SettingsPage/>}/>
                                                </Route>
                                            </Route>
                                        </Routes>
                                    </MessageResponsesProvider>
                                </MessageRequestsProvider>
                            
                            </MessagesProvider>
                        </MessageOutputsProvider>
                         
                      </ConversationProvider>
                  </DisabledComponentProvider>
                </UserProfileProvider>
                 

                                    <Toast/>
                            </ToastProvider>
                    </UserProvider>

        </div>
        </MuiThemeProvider>
        </CacheProvider>
    );
}

export default App;
