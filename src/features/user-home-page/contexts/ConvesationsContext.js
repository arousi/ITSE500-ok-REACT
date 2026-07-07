import {createContext, useState} from 'react';
export const ConversationsContext = createContext(null);
const defaultConversations =   {
    conversations:[
        // {
        //     conversation_id:"",
        //     user_id:"",
        //     visitor_id:"",
        //     title:"",
        //     created_at:"",
        //     updated_at:"",
        //     local_only:false
        // }
    ],
    messages:[
        // {
        //     message_id:"",
        //     user_id:"",
        //     conversation_id:"",
        //     request_id:"",
        //     response_id:"",
        //     output_id:"",
        //     has_image:false,
        //     img_Url:"",
        //     metadata:{},
        //     has_embedding:false,
        //     has_document:false,
        //     doc_url:"",
        //     vote:false
        // }
    ],
    message_requests:[
        // {
        //     request_id:"",
        //     request_model:"",
        //     request_input:"",
        //     request_system_role:"",
        //     request_system_content:"",
        //     request_user_role:"",
        //     request_user_content:"",
        //     request_min_p:0.0,
        //     request_temperature:0.0,
        //     request_top_p:0.0,
        //     request_top_k:0.0,
        //     request_max_tokens:0.0,
        //     request_stop:'',
        //     request_n:0,
        //     request_stream:false
        //     repeat_penalty:0.0,
        //
        // }
    ],
    message_responses:[
        // {
        //   response_id:"",
        //   object:"",
        //   model:"",
        //   created_at:"",
        //   previous_response_id:"",
        //   usage_input_token:0,
        //   usage_output_token:0,
        //   usage_total_token:0,
        //   user:""
        // }
    ],
    message_outputs:[
        // {
        //     output_id:"",
        //     output_type:"",
        //     output_role:"",
        //     output_content_type:"",
        //     output_content_text:""
        // }
    ]
};
export function ConversationsProvider({children}) {
    const  [conversations, setConversations] = useState(defaultConversations);
    return(
        <ConversationsContext.Provider value={{conversations, setConversations}}>
            {children}
        </ConversationsContext.Provider>
    )
}