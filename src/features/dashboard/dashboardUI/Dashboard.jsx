

import {Box, Drawer} from '@mui/material'
import MenuListDrawer from "../components/MenuListDrawer";
import AppBarDrawer from "../components/AppBarDrawer";
import {useEffect, useState , useContext} from "react";
import {Outlet} from "react-router-dom";
import { useReducer } from 'react';
import profileReducer from '../../profile/logic/profileReducer';
import "../dashboard-style.css"
import {OpenDrawerContext} from '../contexts/OpenDrawerContext'
import MainContainer from "../components/MainContainer";
import {OpenAlertProvider} from "../custom-hooks/useAlert";
import Alert from "../components/Alert";
import UserProfileProvider from "../../profile/contexts/UserProfileProvider";
import {SendMessageProvider} from "../../user-home-page/contexts/SendMessageContext";
import {ConversationsProvider} from "../../user-home-page/contexts/ConvesationsContext";
import {SettingsProvider} from "../../settings/contexts/SettingsContext";
import {useAuth} from "../../register/contexts/UserProvider";
import {DisabledComponentProvider , DisabledComponentContext} from "../contexts/DisabledComponentContext";
import {LLMsProviderTypeProvider} from "../../settings/contexts/LLMsProviderTypeContext";
import {ActivateLLMsProviderReactProvider} from "../../profile/contexts/ActivateLLMsProviderContext";
import { SecretKeysProvider } from '../../profile/contexts/SecretKeysContext';
import {DisplayConfigurationProvider} from "../contexts/DisplayConfigurationContext";
import {ConfigurationDialog} from "../../settings/components/ConfigurationDialog";
import {ChatInferenceOptionProvider} from "../../settings/contexts/ChatInferenceOptionContext";

export default function Dashboard() {
    const [open, setOpen] = useState(false);
    const {auth , setAuth} = useAuth();

    const [state , dispatch] = useReducer(profileReducer , {});
    const {setDisabled} = useContext(DisabledComponentContext);
    useEffect(()=>{
        if(auth.data){

          if(auth.data.user_id){
              setDisabled(false);
          }else{
              setDisabled(true);
          }
        }
    }, [auth , setDisabled])
     useEffect(() => {
        // Ensure we always have the latest access token when refresh token exists
        if (auth?.data?.refresh_token) {
            dispatch({ type: 'REFRESH_TOKEN', payload: { auth, setAuth } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.data?.refresh_token]);
    return (
        <Box id="dashboard" sx={{ width:open? "calc(100% - 260)":"100%"  ,  background: '#f5f6fa', flexGrow:open?0 : 8 ,}}>
            <OpenAlertProvider>
                <SendMessageProvider>
                    <DisplayConfigurationProvider>
                     <ConversationsProvider>
                        <LLMsProviderTypeProvider>
                            <ActivateLLMsProviderReactProvider>
                                <SettingsProvider>
                                    <ChatInferenceOptionProvider>
                                    <SecretKeysProvider>
                                        <OpenDrawerContext.Provider value={{open, setOpen}}>
                                            <AppBarDrawer />
                                            <Drawer
                                                id={"drawer"}
                                                anchor="left"
                                                variant="persistent"
                                                sx={{
                                                    width:open ? '260px':0,
                                                    flexGrow:open? 2 : 0 ,

                                                }}
                                                open={open}
                                            >
                                                <MenuListDrawer />
                                            </Drawer>
                                            <MainContainer>
                                                <Outlet/>
                                                <Alert />
                                             <ConfigurationDialog />
                                            </MainContainer>
                                        </OpenDrawerContext.Provider>
                                    </SecretKeysProvider>
                                    </ChatInferenceOptionProvider>
                                   
                                </SettingsProvider>

                            </ActivateLLMsProviderReactProvider>

                        </LLMsProviderTypeProvider>

                    </ConversationsProvider>
                    </DisplayConfigurationProvider>
                    
                </SendMessageProvider>
            </OpenAlertProvider>
        </Box>
    );

}