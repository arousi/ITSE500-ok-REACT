import axios from "axios";
import  {v4 as uuidv4} from "uuid";
import env from "../../../config/env";
import logger from "../../../core/logger";

let anon_id = '';
let device_id = '';
let date_joined = '';
let visitor = {};
/**
 * Attempt server visitor login, fallback to local visitor if server unreachable.
 * Always returns an object with a `data` field: { anon_id, device_id, date_joined }
 * and a `source` field: 'server' | 'local'.
 */
export async function visitorLogin() {
    anon_id = uuidv4();
    device_id = uuidv4();
    date_joined = new Date().toISOString();
    visitor = {
        anon_id,
        device_id,
        date_joined,
    };

    try {
        const authBase = env.authBaseUrl;
        const resp = await axios.post(
            `${authBase}/api/v1/auth_api/visitor-login/`,
            visitor
        );
        // Normalize shape
        return { data: resp.data, source: 'server' };
    } catch (e) {
        // Network error or server down: fallback to local visitor
        logger.error('login', e);
        return { data: visitor, source: 'local', error: e };
    }
}
export async function checkServerConnect(){
    try {
        const authBase = env.authBaseUrl;
        const resp = await axios.get(`${authBase}/api/v1/auth_api/health/`);
        return { data: resp.data, source: 'server' };
    } catch (e) {
        logger.error('login', e);
        return { data: null, source: 'local', error: e };
    }
}
export async function login(userLogin , auth) {
    try{
    const authBase = env.authBaseUrl;
    return await axios.post(`${authBase}/api/v1/auth_api/login/`, userLogin );
    }catch (e) {
        return e;
    }
}
export async function associateDevice(anon_id , device_id){//associate-device
    try{
    const base = env.apiBaseUrl;
    return await axios.post(`${base}/api/v1/chat_api/associate-device/`, {anon_id , device_id });
    }catch(e){
        logger.error('login', e)
    }

}
export async function associateUserDevice(user_id , device_id , auth){//associate-device
    try{
    const base = env.apiBaseUrl;
    return await axios.post(`${base}/api/v1/chat_api/associate-device/`, {user_id , device_id });
    }catch(e){
      logger.error('login', e)
    }
}