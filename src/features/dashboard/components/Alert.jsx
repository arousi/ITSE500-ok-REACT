import {Dialog , DialogTitle , DialogContent, DialogContentText  , Button, DialogActions} from "@mui/material";
import {useAlert} from '../custom-hooks/useAlert'
import {useAuth} from "../../register/contexts/UserProvider";
import {useContext, useReducer} from "react";
import profileReducer from "../../profile/logic/profileReducer";
import {useToast} from "../../dashboard-auth/custom-hooks/useToast";
import historyReducer from "../../history/logic/historyReducer";
import {ConversationsContext} from "../../user-home-page/contexts/ConvesationsContext";
import logger from "../../../core/logger";
import { useTranslation } from "react-i18next";
export default function Alert(){
    const { t } = useTranslation();
    const {auth , setAuth} = useAuth();
    const {alert , hideAlert} = useAlert();
    const { showToast} = useToast();
    // Global conversations (ERD-style) context used by History page
    const { setConversations } = useContext(ConversationsContext);
    const initialState = {
        user_id:"",
        refresh_token:"",
        access_token: "",
    }
    const [/*state*/ , dispatch] = useReducer(profileReducer , initialState);

    const [/*historyState*/ , historyDispatch] = useReducer(historyReducer , {
        conversations: [],
        messages: [],
        message_requests: [],
        message_responses: [],
        message_outputs: []
    });
    logger.debug('alert', alert);
    function selectTypeAlert(){
        return(
            <>
            {
                alert.type === "success" ? <Button onClick={() => hideAlert()}>{t('dashboard.ok')}</Button>
                    : alert.type === "warning" ?
                     <>
                         <Button sx={{fontSize:"1.2rem"}} onClick={() => handleOKButton()}>{t('dashboard.ok')}</Button>
                         <Button sx={{fontSize:"1.2rem"}} onClick={() => hideAlert()}>{t('common.cancel')}</Button>
                    </>
                    :
                    <Button>{t('common.cancel')}</Button>
            }

        </>)
    }
    return(
        <Dialog sx={{minWidth: '330px'}} open={alert.state}>
            <DialogTitle>{alert.title}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{fontSize:23}}>
                    {alert.content}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {selectTypeAlert()}
            </DialogActions>
        </Dialog>
    );

    function handleOKButton(){
        switch(alert.action){
            case"ARCHIVE":{
                dispatch({type:"ARCHIVE_PROFILE",payload:{auth , setAuth}})
                showToast(t('dashboard.archivedProfileSuccess'), 'success');
                break;
            }case "DELETE":{
                dispatch({type:"DELETE_PROFILE",payload:{auth , setAuth}})
                showToast(t('dashboard.deletedProfileSuccess'), 'success');
                break;
            }case"LOGOUT":{
                dispatch({type:"LOGOUT" , payload: {auth , setAuth}}) ;
                showToast(t('dashboard.loggedOutSuccess'), 'success');
                break;
            }case"DELETE_ALL_CHATS":{
                // Clear IndexedDB (handled in reducer) and then reflect immediately in UI
                historyDispatch({type:"DELETE_ALL_CHATS",payload:{ setConversations }})
                showToast(t('dashboard.deletedAllChatsSuccess'), 'success');
                window.location.reload();
                hideAlert();
                break;
            }default:{

            }
        }

    }
}