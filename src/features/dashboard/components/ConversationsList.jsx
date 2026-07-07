import { useNavigate } from 'react-router-dom';
import { List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import "../dashboard-style.css";
import { ConversationContext } from "../contexts/ConversationContext";
import { useContext } from "react";

export default function ConversationsList() {
    const navigate = useNavigate();
    const { conversationsList } = useContext(ConversationContext);
    const list = Array.isArray(conversationsList) ? conversationsList : [];

    return (
        <div id="conversations-container">
            {list.length === 0 ? (
                <div className="conv-empty">No conversations yet</div>
            ) : (
                <List className="conversations-list">
                    {list.map((row, index) => {
                        const id = row.conversationId || index;
                        const title = row.title || `Conversation ${index + 1}`;
                        return (
                            <ListItem key={id} disablePadding>
                                <ListItemButton sx={{height: "65px" , fontSize:"22px" , borderRadius:20}} onClick={() => navigate(`/dashboard/user-home-page/${row.conversationId}`)}>
                                    <Typography className={"conversation-title"}  primary={title} >{title}</Typography>
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </div>
    );
}