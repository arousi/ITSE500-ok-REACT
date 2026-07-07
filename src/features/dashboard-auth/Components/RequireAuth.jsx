import {useAuth} from "../../register/contexts/UserProvider";
import {Navigate , Outlet} from "react-router-dom";
export default function RequireAuth(){
   const {auth, authLoading} = useAuth();

   // Normalize both user and visitor auth shapes
   const data = auth?.data || auth || null;
   const isUser = !!(data && (data.user_id));
   const isVisitor = !!(data && (data.anon_id || data.visitor_id));
  const hasToken = !!(data && (data.access_token));

   if (authLoading) {
     // Avoid redirecting while hydrating IndexedDB
     return null;
   }

  return (isUser || isVisitor || hasToken) ? <Outlet/> : <Navigate to={"/login"}/>
}