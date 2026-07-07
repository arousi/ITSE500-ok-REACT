import {createContext, useCallback, useEffect, useState} from 'react' ;
import { readUserProfileRow, saveUserProfileRow } from '../../user-home-page/logic/connectIndexedDB';
import { useAuth } from '../../register/contexts/UserProvider';

export const UserProfileContext = createContext(null);


export default function UserProfileProvider({children}) {
const { auth } = useAuth();
const [userProfile , _setUserProfile] = useState({
     user_id:"" ,
     first_name:"" , 
     last_name:"" , 
     email:""  , 
     phone_number:"" , 
     user_password:"12345678",
     is_openrouter_user:false , 
     is_google_user:false, 
     is_microsoft_user:false, 
     is_github_user:false, 
     email_verified:false, 
     is_active:false, 
    })
    // Hydrate from IndexedDB on mount when we know the user_id
    useEffect(() => {
        let cancelled = false;
        const uid = auth?.data?.user_id || auth?.user_id || '';
        if (!uid) return;
        (async () => {
            try {
                const row = await readUserProfileRow(uid);
                if (!cancelled && row && typeof row === 'object') {
                    const base = row?.data && !row.user_id ? { ...row.data, user_id: uid } : row;
                    _setUserProfile(prev => ({ ...prev, ...base }));
                }
            } catch (_) { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [auth?.data?.user_id, auth?.user_id]);

    // Persist on updates
    const setUserProfile = useCallback((valueOrUpdater) => {
        _setUserProfile(prev => {
            const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
            try { if (next && (next.user_id || auth?.data?.user_id)) saveUserProfileRow({ ...next, user_id: next.user_id || auth?.data?.user_id }); } catch(_) {}
            return next;
        });
    }, [auth?.data?.user_id]);
    return (
    <UserProfileContext.Provider value={{userProfile , setUserProfile}}>
            {children}
        </UserProfileContext.Provider>
    )
}