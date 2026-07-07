import { deleteAllConversations } from '../../user-home-page/logic/connectIndexedDB';
export default function historyReducer(state , action){

    switch(action.type){

        case "CREATE_CHAT":{

            break;
        }
        case "DELETE_CHAT":{

            break;
        }
        case "DELETE_ALL_CHATS":{
            // Clear IndexedDB and then clear conversations in UI via provided setter
            deleteAllConversations()
                .then(() => {
                    if (action.payload && typeof action.payload.setConversations === 'function') {
                        action.payload.setConversations({
                            conversations: [],
                            messages: [],
                            message_requests: [],
                            message_responses: [],
                            message_outputs: []
                        });
                    }
                    // طلب المستخدم: إعادة تحميل الصفحة بعد الحذف
                    try { if (typeof window !== 'undefined' && window.location) window.location.reload(); } catch(_) {}
                })
                .catch(() => {/* ignore */});
            break;
        }default:{

          throw new Error(`Unhandled action ${action.type}`);
        }
    }


    return state ;
}