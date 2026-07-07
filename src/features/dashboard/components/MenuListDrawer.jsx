
import { ArrowBackIosNew, Email, Settings, Person, Logout } from '@mui/icons-material';
import React from 'react';
import ConversationsList from "./ConversationsList";
import "../dashboard-style.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect } from 'react';
import profileReducer from "../../profile/logic/profileReducer";
import { List, ListItem, ListItemButton, Divider, Typography } from "@mui/material";
import { OpenDrawerContext } from "../contexts/OpenDrawerContext"
import { useAlert } from "../custom-hooks/useAlert";
import { useAuth } from "../../register/contexts/UserProvider";
import { UserProfileContext } from "../../profile/contexts/UserProfileProvider";
import { ConversationContext } from "../contexts/ConversationContext";
import { ConversationsContext } from "../../user-home-page/contexts/ConvesationsContext";
import { readAllConversationsForOwner, refreshConversations } from "../../user-home-page/logic/connectIndexedDB";
import { getUserConversationsFromServer } from "../../user-home-page/logic/connectServer";
import { useTranslation } from "react-i18next";

export default function MenuListDrawer() {
    const { t } = useTranslation();
    let { setOpen } = useContext(OpenDrawerContext);
    const { conversationsList } = useContext(ConversationContext)
    const { setUserProfile } = useContext(UserProfileContext);
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [, dispatchProfile] = React.useReducer(profileReducer, {});
    const { setConversationsList } = useContext(ConversationContext);
    const { conversations } = useContext(ConversationsContext);

    useEffect(() => {
        let mounted = true;
        const user_id = auth?.data?.user_id || '';
        const visitor_id = auth?.data?.anon_id || (typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '');
        readAllConversationsForOwner({ user_id, visitor_id }).then(async (packet) => {
            if (!mounted) return;
            const localConvs = Array.isArray(packet?.conversations) ? packet.conversations : [];
            if (localConvs.length > 0) {
                const convs = localConvs.map((c) => ({ conversationId: c.conversation_id, title: c.title || `Conversation` }));
                setConversationsList(convs);
                return;
            }
            if (user_id) {
                try {
                    const serverPacket = await getUserConversationsFromServer(auth);
                    if (!mounted || !serverPacket) return;
                    const ownerUserId = user_id;
                    const ownerVisitorId = '';
                    const tag = (arr) => Array.isArray(arr) ? arr.map(x => ({
                        ...x,
                        user_id: ownerUserId,
                        visitor_id: ownerVisitorId
                    })) : [];

                    const taggedConvs = tag(serverPacket.conversations);
                    const taggedMsgs = tag(serverPacket.messages);
                    const taggedReqs = tag(serverPacket.message_requests);
                    const taggedResps = tag(serverPacket.message_responses);
                    const taggedOuts = tag(serverPacket.message_outputs);

                    refreshConversations(
                        taggedConvs,
                        taggedMsgs,
                        taggedReqs,
                        taggedResps,
                        taggedOuts
                    );
                    const convs = (taggedConvs || []).map(c => ({ conversationId: c.conversation_id, title: c.title || `Conversation` }));
                    setConversationsList(convs);
                } catch (_) { /* ignore */ }
            } else {
                setConversationsList([]);
            }
        }).catch(() => { /* ignore */ });
        return () => { mounted = false; };
    }, [auth, setConversationsList])

    useEffect(() => {
        try {
            const list = Array.isArray(conversations?.conversations)
                ? conversations.conversations.map(c => ({ conversationId: c.conversation_id, title: c.title || 'Conversation' }))
                : [];
            setConversationsList(list);
        } catch (_) { /* ignore */ }
    }, [conversations?.conversations, setConversationsList]);

    return (
        <nav id="menu-items">
            <List id={"menu-list"}>
                <div className={"menu-drawer-items"}>
                    <ListItem className="drawer-header">
                        <ListItemButton onClick={() => setOpen(false)} className="drawer-close-btn">
                            <ArrowBackIosNew sx={{ width: 45, height: 45 }} />
                        </ListItemButton>
                    </ListItem>
                    <Divider />

                    <ListItem className="drawer-conversations-slot">
                        <ConversationsList />
                    </ListItem>
                    <ListItem>
                        <Divider />
                    </ListItem>

                    <div className={"navigate-buttons"}>
                        <ListItem>
                            <ListItemButton sx={{ height: "50px" }} component={Link} to={"history"} disabled={conversationsList.length === 0}  >
                                <Typography sx={{ margin: "auto", fontSize: "22px" }} >{t('dashboard.viewAll')}</Typography>
                            </ListItemButton>
                        </ListItem>


                        <ListItem className={"menu-item"}>
                            <ListItemButton onClick={() => {
                                handleProfileButton();

                            }} className={"list-buttons"}>
                                <Typography sx={{ fontSize: "1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className={"name-button"}> <Person sx={{ width: 35, height: 35 }} />{t('nav.profile')}</Typography>
                            </ListItemButton>
                        </ListItem>
                        <ListItem className={"menu-item"}>
                            <ListItemButton component={Link} to={"settings"} className={"list-buttons"}>
                                <Typography sx={{ fontSize: "1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className={"name-button"}><Settings sx={{ width: 35, height: 35 }} />{t('nav.settings')}</Typography>
                            </ListItemButton>
                        </ListItem>
                        <ListItem className={"menu-item"}>
                            <ListItemButton onClick={handleSendFeedback} className={"list-buttons"}>
                                <Typography sx={{ fontSize: "1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className={"name-button"}> <Email sx={{ width: 35, height: 35 }} />{t('nav.feedback')}</Typography>
                            </ListItemButton>
                        </ListItem>
                        <ListItem className={"menu-item"}>
                            <ListItemButton onClick={() => {
                                handleLogout()
                            }} className={"list-buttons"} id={"logout-button"}>
                                <Logout sx={{ width: 35, height: 35 }} /><Typography sx={{ fontSize: "1em" }} >{t('nav.logout')}</Typography>
                            </ListItemButton>
                        </ListItem>
                    </div>
                </div>
            </List>
        </nav>
    );

    function handleProfileButton() {
        if (auth.data) {
            if (auth.data.user_id) {
                dispatchProfile({ type: "GET_PROFILE", payload: { auth, setUserProfile } });
                navigate("/dashboard/profile")
            } else {
                showAlert();
                navigate("/dashboard/profile")
            }
        }

        // no-op
    }

    function handleLogout() {
        showAlert(true, "warning", t('nav.logout'), t('dashboard.confirmLogout'), "LOGOUT");
    }

    function handleSendFeedback() {
        try {
            const to = 'sanad.arousi@outlook.com';
            const user = auth?.data || {};
            const subject = encodeURIComponent('App Feedback');
            const prefill = [
                'Please describe your feedback below.', '',
                `User: ${user.username || user.user_name || 'anonymous'}`,
                user.user_id ? `User ID: ${user.user_id}` : '',
                user.email ? `Email: ${user.email}` : ''
            ].filter(Boolean).join('\n');
            const body = encodeURIComponent(prefill + '\n\n');
            const href = `mailto:${to}?subject=${subject}&body=${body}`;
            window.location.href = href;
            setOpen(false);
        } catch (_) {
            showAlert(true, 'error', t('dashboard.feedback'), t('dashboard.mailClientError'), t('dashboard.ok'));
        }
    }
}