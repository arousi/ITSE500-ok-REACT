
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import Menu from '@mui/icons-material/Menu';
import TryIcon from '@mui/icons-material/Try'; //switch to add_comment icon
import Settings from '@mui/icons-material/Settings';
import MoreVert from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import MuiMenu from '@mui/material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OpenDrawerContext } from "../contexts/OpenDrawerContext";
import { ConversationsContext } from "../../user-home-page/contexts/ConvesationsContext";
import "../dashboard-style.css"
import { DisplayConfigurationContext } from "../contexts/DisplayConfigurationContext";
import { preparingConversation } from "../../user-home-page/logic/conversationOperations";
// import { refreshConversations } from "../../user-home-page/logic/connectIndexedDB";
import { SendMessageContext } from "../../user-home-page/contexts/SendMessageContext";
import { useAuth } from "../../register/contexts/UserProvider";
import { OptionStorageContext } from "../../profile/contexts/OptionStorageContext";
import CustomSwitch from "../../profile/components/CustomSwitch";
import logger from "../../../core/logger";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../settings/components/LanguageSwitcher";
// import { sendUserConversationsToServer } from "../../user-home-page/logic/connectServer";
// import { buildServerSyncPacket } from "../../user-home-page/logic/conversationOperations";
export default function AppBarDrawer() {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false)
    const { setStorageOption, storageOption } = useContext(OptionStorageContext)
    const { setOpen, open } = useContext(OpenDrawerContext);
    const { setDisplayConfiguration } = useContext(DisplayConfigurationContext);
    useContext(ConversationsContext);
    const { setMessages, setContents } = useContext(SendMessageContext);
    const navigate = useNavigate();
    const { auth } = useAuth();
    const isSmall = useMediaQuery('(max-width:640px)');
    const [moreEl, setMoreEl] = useState(null);
    const iconSize = isSmall ? 32 : 45;

    useEffect(() => {
        setStorageOption(checked ? 'mixed' : 'local');
    }, [setStorageOption, storageOption, checked])
    useAuth();
    return (
        <AppBar
            sx={{
                position: "fixed",
                zIndex: (theme) => theme.zIndex.drawer + 1,
                width: open ? (isSmall ? '100%' : 'calc(100% - var(--drawer-width))') : '100%',
                marginLeft: open ? (isSmall ? 0 : 'var(--drawer-width)') : 0,
                transition: 'width 0.3s, margin 0.3s',
                boxShadow: 2,
                // Match drawer color in light mode; use CSS vars so it adapts with theme
                backgroundColor: 'var(--dashboard-drawer-bg)',
                color: 'var(--dashboard-text)'
            }}
        >
            <Toolbar id="appbar" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => setOpen(!open)}
                        sx={{ mr: 2 }}
                    >
                        <Menu sx={{ width: iconSize, height: iconSize }} />
                    </IconButton>
                    <Typography variant="h6" noWrap>
                        O.K Teams Project
                    </Typography>

                </Box>
                {isSmall ? (
                    <>
                        <LanguageSwitcher />
                        <IconButton onClick={(e) => setMoreEl(e.currentTarget)} aria-label="more">
                            <MoreVert sx={{ width: iconSize, height: iconSize }} />
                        </IconButton>
                        <MuiMenu
                            anchorEl={moreEl}
                            open={Boolean(moreEl)}
                            onClose={() => setMoreEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem onClick={() => { setChecked(!checked); setMoreEl(null); }}>
                                {checked ? t('dashboard.useLocalStorage') : t('dashboard.useSyncedStorage')}
                            </MenuItem>
                            <MenuItem onClick={() => { handleCreateChat(); setMoreEl(null); }}>
                                {t('dashboard.newChat')}
                            </MenuItem>
                            <MenuItem onClick={() => { setDisplayConfiguration(true); setMoreEl(null); }}>
                                {t('nav.settings')}
                            </MenuItem>
                        </MuiMenu>
                    </>
                ) : (
                    <div className="appbar-controls">
                        <LanguageSwitcher />
                        <div className="sync-toggle">
                            <Typography component="span" sx={{ fontSize: '23px', mr: 1 }}>{t('dashboard.synced')}</Typography>
                            <CustomSwitch checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                            <Typography component="span" sx={{ fontSize: '23px', ml: 1 }}>{t('dashboard.local')}</Typography>
                        </div>
                        <IconButton onClick={() => handleCreateChat()} aria-label="create-chat">
                            <TryIcon sx={{ width: iconSize, height: iconSize }} />
                        </IconButton>
                        <IconButton onClick={() => setDisplayConfiguration(true)} aria-label="settings">
                            <Settings sx={{ width: iconSize, height: iconSize }} />
                        </IconButton>
                    </div>
                )}
            </Toolbar>
        </AppBar>
    )

    function handleCreateChat() {
        setContents([]);
        setMessages([]);
        const ownerUserId = auth?.data?.user_id || '';
        const ownerVisitorId = auth?.data?.anon_id || (typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '');
        const conversation = preparingConversation({ user_id: ownerUserId, visitor_id: ownerVisitorId });
        logger.debug('drawer', conversation);
        navigate(`user-home-page/0`);
    }


}