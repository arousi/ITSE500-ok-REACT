import { api } from "../../../core/apiClient";
import logger from "../../../core/logger";

export  async function createNewUserAccount(userRegister) {

   try{
   // Send the registration payload as top-level fields (username, email, ...)
   // The backend expects plain JSON with those fields, not nested under `data`.
   return await api.post('/auth_api/register/', userRegister);
   }catch (e) {
    logger.error('register', 'register failed', e);
    throw e;
   }


}