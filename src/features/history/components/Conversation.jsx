import {Card , Typography , IconButton} from "@mui/material"
import {Assistant , Delete} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import "../history-styles.css";
import { useToast } from "../../dashboard-auth/custom-hooks/useToast";
import { deleteConversation } from "../../user-home-page/logic/connectIndexedDB";
import { useTranslation } from "react-i18next";
export default function Conversation({conversationId, title, onAfterDelete}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    return(
        <Card id={"conversation-card"}>
            <div id={"title"}  onClick={()=> navigate(`/dashboard/user-home-page/${conversationId}`)}>
                <Assistant sx={{width:40 , height:40}}/>
                <Typography  variant={"h4"}>{title || t('history.conversation')}</Typography>
            </div>
            <IconButton id={"deleteButton"} onClick={()=>{
                handleDeleteConversation();
            }}><Delete/></IconButton>
        </Card>
    )
    async function handleDeleteConversation() {
        try {
            const ok = await deleteConversation(conversationId);
            if (ok) {
                // طلب المستخدم: إعادة تحميل الصفحة بعد الحذف
                try { showToast(t('history.conversationDeletedSuccess')); } catch(_) {}
                if (typeof window !== 'undefined' && window.location) {
                    window.location.reload();
                }
            } else {
                showToast(t('history.conversationDeleteFailed'));
            }
        } catch (e) {
            console.error(e);
            showToast(t('history.conversationDeleteFailed'));
        }
    }
}