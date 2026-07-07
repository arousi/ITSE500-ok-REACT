import { Typography , Button } from '@mui/material';
import RegisterDialog from '../../register/components/RegisterDialog';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../../register/contexts/UserProvider";
import { useContext, useEffect, useReducer, useState } from 'react';
// import { useToast } from "../../dashboard-auth/custom-hooks/useToast";
import { DisabledComponentContext } from "../../dashboard/contexts/DisabledComponentContext";
// import { useAlert } from "../../dashboard/custom-hooks/useAlert";
// import { useAuth } from "../../register/contexts/UserProvider";
import PersonalInformationCard from "../components/PersonalInformationCard";
import SecretKeyProviderCard from "../components/SecretKeyProviderCard";
// import { ActivateLLMsProviderContext } from "../contexts/ActivateLLMsProviderContext";
import { UserProfileContext } from "../contexts/UserProfileProvider";
// import { getProfile } from "../logic/connectServer";
import profileReducer from "../logic/profileReducer";
// import OptionsStorage from '../components/OptionsStorage';
import "../profile-styles.css";
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import OAuthActivateComponent from '../components/OAuthActivateComponent';
import DeleteOrArchiveAccountDialog from '../components/DeleteOrArchiveAccountDialog';
import { useTranslation } from 'react-i18next';
export default function ProfilePage() {
    const { t } = useTranslation();
    // const {auth} = useAuth();
    // const {showAlert} = useAlert();
    // const {showToast} = useToast();
    const navigate = useNavigate(); // currently unused
    useContext(UserProfileContext);
    const initialState = {
        first_name: '',
        last_name: '',
        email: '',
        user_id: '',
        phone_number:'',
        gemini_key:'',
        open_router_key:'',
    }
    const {auth, setAuth} = useAuth();
    const [openDialog , setOpenDialog] = useState(false);
    useContext(DisabledComponentContext);
    const [, dispatch] = useReducer(profileReducer , initialState);
    const [/* error */  , /* setError */] = useState("");

    // سياق تفعيل المزودين
    // const {activateLLMs, setActivateLLMs} = useContext(ActivateLLMsProviderContext);

    // عدّادات افتراضية للنماذج (يمكن ربطها بمصدر فعلي لاحقاً)
    // const [modelCounts] = useState({
    //     gemini: {selected: 1, total: 37},
    //     lmstudio: {selected: 0, total: 3},
    //     openai: {selected: 0, total: 13},
    // });

    // حالة وتمكين LM Studio محلياً
    // const [isLmEnabled, setIsLmEnabled] = useState(false);
    // const [lmBaseUrl, setLmBaseUrl] = useState("http://127.0.0.1:1234/");

    // const serverUUID = auth?.data?.user_id || userProfile?.user_id || "";

    // function handleCopy(text){
    //     if (!navigator?.clipboard) return;
    //     navigator.clipboard.writeText(text).then(()=>{
    //         showToast('Copied to clipboard', 'success');
    //     }).catch(()=>{});
    // }

    useEffect(() => {
        // Ensure we always have the latest access token when refresh token exists
        if (auth?.data?.refresh_token) {
            dispatch({ type: 'REFRESH_TOKEN', payload: { auth, setAuth } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.data?.refresh_token]);
    const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
    return(
            <div id={"profile-container"} className="settings-like-bg">
                    <PersonalInformationCard/>

                    {auth?.data?.refresh_token == null && (
                        <Button onClick={() => setOpenRegisterDialog(true)} sx={{backgroundColor: 'lightgray',
                                 marginTop:"10px", 
                                 width:"300px" ,
                                 height:'80px', 
                                 border: '2px solid black',
                                 fontSize: '20px',
                                 borderRadius:"40px",
                                 textTransform:"capitalize"
                                }}
                             ><PersonAddAltIcon/>{t('profile.createNewAccount')}</Button>
                    )}
                    <RegisterDialog open={openRegisterDialog} onClose={() => setOpenRegisterDialog(false)} />
                    <div className={"provider-container"}>
                        <Typography sx={{fontSize:35}}>{t('profile.providers')}</Typography>
                        <SecretKeyProviderCard label={"Gemini"}  type={'GOOGLE'} />
                        <SecretKeyProviderCard label={"OpenRouter"} type={'OPENROUTER'}/>
                        <SecretKeyProviderCard label={"OpenAI"} type={'OPENAI'}/>
                        <SecretKeyProviderCard label={"HuggingFace"} type={'HUGGINGFACE'}/>
                        <SecretKeyProviderCard label={"LM Studio"} type={'LM_STUDIO'}/>
                    </div>
                     <div className={"provider-container"}>
                    <Typography sx={{fontSize:35 , textAlign:"left" , marginLeft:"10px"}}>{t('profile.authentication')}</Typography>
                     <div className={"oauth-container"}>
                     <OAuthActivateComponent/>
                     </div>


                    </div>
                    {auth?.data?.user_id != null && ( <div>
                        <Button onClick={() => setOpenDialog(true)} sx={{backgroundColor: 'red',
                                 width:"300px" ,
                                 height:'80px',
                                 marginTop:"0",
                                 position:"relative",
                                 bottom:"10px",
                                 fontSize: '20px',
                                 color:'white',
                                 borderRadius:"40px",
                                 textTransform:"capitalize"
                                }}>{t('profile.archiveOrDeleteAccount')}</Button>
                     </div>)}
                    <DeleteOrArchiveAccountDialog openDialog={openDialog} setOpenDialog={setOpenDialog} />
                </div>

    )
    // function handleArchiveProfile(){
    //     showAlert(true , "warning" , "archive profile" ,"Do you really want to archive your account?" , "ARCHIVE")
    // }
    // function handleDeleteProfile(){
    //     showAlert(true , "warning" , "delete profile" ,"Do you really want to delete this account? It will result in the loss of your data." , "DELETE")
    // }
    // async  function handleUpdateData(){
    //     setUserProfile({...userProfile, user_id: auth.user_id})
    //     const userUpdated = { user_id:auth.data.user_id, username:userProfile.username, first_name : userProfile.first_name , last_name : userProfile.last_name , email : userProfile.email , phone_number : userProfile.phone_number };
    //     dispatch({type:"UPDATE_PROFILE", payload:{userUpdated , setError , auth}});
    //     showToast('updated data successfully', 'success');
    // }
    // function handleLogout(){ showAlert(true , "warning" , "logout" ,"Do you really want to log out of the system?" , "LOGOUT") }
    // function handleEditNotification(){ showAlert(true , "success" , "Edit notification" ,"I will take you to your device settings." , "EDIT_NOTIFICATION") }
    // async function handleFeedback(){ const data = await getProfile(auth); console.log(data); showAlert(true , "success" , "Send feedback" ,"I will take you to your device settings." , "FEEDBACK") }
}

