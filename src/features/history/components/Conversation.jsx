import {Card , Typography , IconButton} from "@mui/material"
import {Assistant , Delete} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import "../history-styles.css";
import { useToast } from "../../dashboard-auth/custom-hooks/useToast";
import { deleteConversation } from "../../user-home-page/logic/connectIndexedDB";
export default function Conversation({conversationId, title, onAfterDelete}) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    return(
        <Card id={"conversation-card"}>
            <div id={"title"}  onClick={()=> navigate(`/dashboard/user-home-page/${conversationId}`)}>
                <Assistant sx={{width:40 , height:40}}/>
                <Typography  variant={"h4"}>{title || 'Conversation'}</Typography>
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
                try { showToast("Conversation deleted successfully"); } catch(_) {}
                if (typeof window !== 'undefined' && window.location) {
                    window.location.reload();
                }
            } else {
                showToast("Failed to delete conversation");
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to delete conversation");
        }
    }
}