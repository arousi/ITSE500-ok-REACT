import {Container  , Button} from '@mui/material'
import {Delete} from '@mui/icons-material';
import {useAlert} from "../../dashboard/custom-hooks/useAlert";
import Conversation from '../components/Conversation'
import "../history-styles.css"
import {ConversationsContext} from "../../user-home-page/contexts/ConvesationsContext";
import {useContext, useEffect} from "react";
import { readAllConversationsForOwner, refreshConversations } from "../../user-home-page/logic/connectIndexedDB";
import { useAuth } from "../../register/contexts/UserProvider";
import { getUserConversationsFromServer } from "../../user-home-page/logic/connectServer";
import { useTranslation } from "react-i18next";
export default function HistoryPage() {
    const { t } = useTranslation();
    const {conversations, setConversations} = useContext(ConversationsContext);
    const { auth } = useAuth();
    const { showAlert } = useAlert();
    useEffect(() => {
        // Load persisted conversations and push into context
        let mounted = true;
    const visitor_id = localStorage.getItem('visitor_id') || auth?.data?.anon_id || '';
    const user_id = auth?.data?.user_id || '';
    readAllConversationsForOwner({ user_id, visitor_id })
            .then((data) => {
                if (!mounted || !data) return;
                const merged = {
                    conversations: Array.isArray(data.conversations) ? data.conversations : [],
                    messages: Array.isArray(data.messages) ? data.messages : [],
                    message_requests: Array.isArray(data.message_requests) ? data.message_requests : [],
                    message_responses: Array.isArray(data.message_responses) ? data.message_responses : [],
                    message_outputs: Array.isArray(data.message_outputs) ? data.message_outputs : []
                };
                setConversations(merged);
                // If local is empty and user is authenticated, pull from server then persist locally
                const isEmpty = merged.conversations.length === 0 && merged.messages.length === 0;
                if (isEmpty && auth?.data?.user_id) {
                    getUserConversationsFromServer(auth).then((serverPacket) => {
                        if (!serverPacket) return;
                        try {
                            const ownerUserId = auth?.data?.user_id || '';
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
                            // Reflect in UI with owner-tagged rows
                            setConversations({
                                conversations: taggedConvs,
                                messages: taggedMsgs,
                                message_requests: taggedReqs,
                                message_responses: taggedResps,
                                message_outputs: taggedOuts
                            });
                        } catch (_) { /* ignore */ }
                    }).catch(() => {/* ignore */});
                }
            })
            .catch(() => { /* ignore */ });
        return () => { mounted = false; };
    }, [setConversations, auth]);

    const list = Array.isArray(conversations?.conversations) ? conversations.conversations : [];
    const hasActivity = (convId) => {
        const msgs = (conversations?.messages || []).some(m => m.conversation_id === convId);
        const outs = (conversations?.message_outputs || []).some(o => o.conversation_id === convId || (o.message_id && (conversations?.messages || []).some(m => m.message_id === o.message_id)));
        const reqs = (conversations?.message_requests || []).some(r => r.message_id && (conversations?.messages || []).some(m => m.message_id === r.message_id));
        return msgs || outs || reqs;
    };
    const filtered = list.filter(c => hasActivity(c.conversation_id));
    const conversationList = filtered.map(conv => (
        <Conversation conversationId={conv.conversation_id} title={conv.title} key={conv.conversation_id}/>
    ));

    return(
        <Container  id={"container-history"} >
            <Button onClick={()=>{
                handleDeleteAllConversations();
            }} variant={"contained"} id={"deleteAll"} startIcon={<Delete/>}>{t('history.deleteAll')}</Button>
            {conversationList}
        </Container>
    )

    function handleDeleteAllConversations(){
        showAlert(true , "warning" , t('history.deleteAllConversationsTitle') , t('history.deleteAllConversationsConfirm') , "DELETE_ALL_CHATS")

    }
}