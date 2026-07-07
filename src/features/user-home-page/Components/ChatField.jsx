import {Card, TextareaAutosize, IconButton, Tooltip} from "@mui/material";
import {Send, Cancel, Stop} from '@mui/icons-material';
import {React} from "react";
import "../home.css"
import {useState , useContext , useEffect, useRef} from "react";
import {getAIResponse} from "../logic/connectAI";
import logger from "../../../core/logger";
import { SecretKeysContext } from '../../profile/contexts/SecretKeysContext';
import {SendMessageContext} from "../contexts/SendMessageContext";
import {IsStoredAIMessageContext} from "../contexts/IsStoredAIMessageContext";
import UploadFileButton from "./UploadFileButton";
import {URLFileContext} from "../contexts/URLFileProvider";
import {useParams} from "react-router-dom";
import {FileContext} from "../contexts/FileProvider";
import {SettingsContext} from "../../settings/contexts/SettingsContext";
import ModelsAutoComplete from "./ModelsAutoComplete";
import {ModelSelectedContext} from "../contexts/ModelSelectedContext";
import {
    buildAIResponse,
    buildUserMessage,
    buildStorableRequest,
    buildStorableResponse,
    buildStorableOutput,
    buildStorableMessages,
    buildStorableAttachment,
    preparingConversation
} from "../logic/conversationOperations";
import { autoTitleConversation } from "../logic/conversationOperations";
import { ConversationsContext } from "../contexts/ConvesationsContext";
import { MessagesContext } from "../contexts/MessagesContext";
import { MessageRequestsContext } from "../contexts/MessageRequestsContext";
import { MessageResponsesContext } from "../contexts/MessageResponsesContext";
import { MessageOutputsContext } from "../contexts/MessageOutputsContext";
import { refreshConversations } from "../logic/connectIndexedDB";
import { buildServerSyncPacket } from "../logic/conversationOperations";
import { sendUserConversationsToServer, sendVisitorConversationsToServer } from "../logic/connectServer";
import { useAuth } from "../../register/contexts/UserProvider";
import {useToast} from "../../dashboard-auth/custom-hooks/useToast";
import { v4 as uuidv4 } from 'uuid';
import { OptionStorageContext } from '../../profile/contexts/OptionStorageContext';
import { OpenDrawerContext } from '../../dashboard/contexts/OpenDrawerContext';
import { useTranslation } from "react-i18next";
export default function ChatField() {
    const { t } = useTranslation();
    const {settings} = useContext(SettingsContext);
    const {modelSelected} = useContext(ModelSelectedContext);
    const { keys } = useContext(SecretKeysContext);
    const [text , setText] = useState("")
    const {file , setFile} = useContext(FileContext);
    const {messages , setMessages , contents , setContents, isLoading, setIsLoading} = useContext(SendMessageContext);
    // flat stores for storable rows
    const { setMessages: setFlatMessages } = useContext(MessagesContext);
    const { setMessageRequests } = useContext(MessageRequestsContext);
    const { setMessageResponses } = useContext(MessageResponsesContext);
    const { setMessageOutputs } = useContext(MessageOutputsContext);
    const { conversations, setConversations } = useContext(ConversationsContext);
    const { setIsStoredMessage} = useContext(IsStoredAIMessageContext);
    const [display , setDisplay] = useState("none");
    const {setFilePath , filePath} = useContext(URLFileContext);
    // conversationsList (from another context) غير مستخدم هنا
    const {conversationId} = useParams();
    const [controller, setController] = useState(null);
    // use global loading from context (drives typing animation in ChatArea)
    const { showToast } = useToast();
    const { auth } = useAuth();
    const { storageOption } = useContext(OptionStorageContext);
    const { open: drawerOpen } = useContext(OpenDrawerContext) || {};
    // hold a draft conversation while user is on /user-home-page/0 so we don't create multiple
    const draftConvRef = useRef(null);
    // prevent concurrent unified syncs per conversation
    const inflightByConv = useRef(new Map());
    // last sync timestamps to debounce bursts
    const lastSyncRef = useRef(new Map());

    async function handleSendMessage(){
         if (text.trim().length === 0 && file === null) return;

         // block sending if provider isn't connected (enabled + valid key)
         const providerKey = (modelSelected?.provider || '').toLowerCase();
         const keyMap = {
             google: 'google',
             openrouter: 'openrouter',
             'open router': 'openrouter',
             openai: 'openai'
         };
         const k = keyMap[providerKey] || providerKey;
         const isConnected = !!keys?.[k]?.enabled && !!keys?.[k]?.key && !!keys?.[k]?.valid;
         if (!isConnected) {
             showToast(t('chat.errors.providerNotConnected'), 'error');
             return;
         }

         setIsStoredMessage(false);
         const newController = new AbortController();
         setController(newController);
         setIsLoading(true);

         // 1) بناء رسالة المستخدم للـ UI بحسب المزوّد
         const userMessage = buildUserMessage(text, file, modelSelected  , filePath) ;
         // ضع معرفًا فريدًا لتثبيت مفاتيح React
         userMessage.cid = uuidv4();

         // 2. نسخ من الحالة الحالية
         const updatedMessages = [...messages];
         const updatedContents = [...contents];

         const isGoogle = (modelSelected?.provider || '').toLowerCase() === 'google';
         if (!isGoogle) {
             updatedMessages.push(userMessage);
             // Show the user message immediately
             setMessages(updatedMessages);
         } else {
             updatedContents.push(userMessage);
             // Show the user message immediately
             setContents(updatedContents);
         }

            // 2) بناء صفوف التخزين الأولية: user message row + request row (+ optional attachment row)
         // Resolve current conversation. If route is /0 and we already created a draft in this session,
         // reuse it to avoid creating a new conversation per send.
         let conv = null;
         if (conversationId === '0' && draftConvRef.current) {
             const existing = (conversations?.conversations || []).find(
                 c => c.conversation_id === draftConvRef.current.conversation_id
             );
             conv = existing || draftConvRef.current;
         } else {
             conv = (conversations?.conversations || []).find(c => c.conversation_id === conversationId) || null;
         }
         let isNewConversation = false;
         if (!conv) {
             const ownerUserId = auth?.data?.user_id || '';
             const ownerVisitorId = auth?.data?.anon_id || (typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '');
             conv = preparingConversation({ user_id: ownerUserId, visitor_id: ownerVisitorId });
             // إذا كان لدينا conversationId في الرابط، عيّنه
             if (conversationId && conversationId !== '0') {
                 conv.conversation_id = conversationId;
             }
             isNewConversation = true;
             // لا نقوم بالتخزين المحلي هنا؛ سنضيفه عند أول request/response
             setConversations(prev => {
                 const base = prev && Array.isArray(prev.conversations) ? prev : { conversations: [], messages: [], message_requests: [], message_responses: [], message_outputs: [] };
                 return { ...base, conversations: [conv, ...base.conversations] };
             });
             // cache the newly created draft conversation for /0 route
             if (conversationId === '0') {
                 draftConvRef.current = conv;
             }
         }
         const [userMsgRow, aiMsgRowTemplate] = buildStorableMessages(null, null, conv);
         // Prepare attachment rows array (user upload first if present)
         const attachments = [];
         if (file && (file.base64 || file.type)) {
             const att = buildStorableAttachment({
                 type: (file.type && file.type.startsWith('image/')) ? 'image' : 'other',
                 mime_type: file.type || '',
                 file_base64: (file.base64 || '').replace(/^data:[^;]+;base64,/, ''),
                 file_url: ''
             }, { message_id: userMsgRow.message_id, conversation_id: conv.conversation_id });
             attachments.push(att);
         }
         // اربط الـ request بالرسالة الأولى (المستخدم)
         const requestPayload = isGoogle
             ? { contents: [{ role: 'user', parts: userMessage?.data?.parts || [{ text }] }] }
             : { messages: [{ role: 'user', content: userMessage?.data?.content || text }] };
         const requestRow = buildStorableRequest(requestPayload, userMsgRow.message_id);
         userMsgRow.request_id = requestRow.request_id;

         // حدّث السياقات المسطحة مؤقتاً
         setFlatMessages(prev => [...prev, userMsgRow]);
         setMessageRequests(prev => [...prev, requestRow]);



         try{
             const aiResult = await getAIResponse(updatedMessages , updatedContents , settings , file , modelSelected ,newController.signal, keys);
             // aiResult: { text, raw, image? }
             logger.debug('chat', aiResult);
             let newAIText = "";
              newAIText = (typeof aiResult?.text === 'string') ? aiResult.text : '';
             const newAIFile = (typeof aiResult?.image === 'object') ? aiResult.image : null;
             logger.debug('chat', newAIFile);
             // 4. بناء رسالة المساعد
             const aiMessage = buildAIResponse(newAIText,newAIFile, modelSelected);
             if (aiResult?.image) {
                 const mime = aiResult.image.mime_type || 'image/png';
                 aiMessage.filePath = aiResult.image.base64 ? `data:${mime};base64,${aiResult.image.base64}` : (aiResult.image.url || '');
                 aiMessage.fileType = mime;
             }
             // فعّل الأنيميشن لهذه الرسالة فقط واستعمل معرفًا فريدًا كمفتاح
             aiMessage.animate = true;
             aiMessage.cid = uuidv4();

             // 3) تحديث واجهة الرسائل
             // أضف رسالة AI بعد ظهور رسالة المستخدم
             if (!isGoogle) { updatedMessages.push(aiMessage); setMessages(updatedMessages); }
             else { updatedContents.push(aiMessage); setContents(updatedContents); }

             // 4) بناء صف الاستجابة والمخرج وربطهما برسالة المساعد
             const aiMsgRow = { ...aiMsgRowTemplate }; // انسخ القالب وامنحه معرفاً ثابتاً تم توليده في القالب
             const responseRow = buildStorableResponse(aiResult?.raw || {}, aiMsgRow.message_id);
             const outputRow = buildStorableOutput(
                 { text: newAIText, raw: aiResult?.raw || null, image: aiResult?.image || null },
                 aiMsgRow.message_id
             );
             // اربط معرفات الرد/المخرج بالرسالة
             aiMsgRow.response_id = responseRow.response_id;
             aiMsgRow.output_id = outputRow.output_id;

             // If AI produced an image, store it also as an attachment row
             if (aiResult?.image && (aiResult.image.base64 || aiResult.image.url)) {
                 const fileType = aiResult.image.mime_type || 'image/png';
                 const aiAtt = buildStorableAttachment({
                     type: 'image',
                     mime_type: fileType,
                     file_base64: (aiResult.image.base64 || '').replace(/^data:[^;]+;base64,/, ''),
                     file_url: aiResult.image.url || ''
                 }, { message_id: aiMsgRow.message_id, conversation_id: conv.conversation_id });
                 attachments.push(aiAtt);
             }

             // 5) حدّث السياقات المسطحة
             setFlatMessages(prev => [...prev, aiMsgRow]);
             setMessageResponses(prev => [...prev, responseRow]);
             setMessageOutputs(prev => [...prev, outputRow]);

             // 6) حضّر JSON موحّد لإرساله إلى IndexedDB
             const bundle = {
                 conversations: isNewConversation ? [conv] : [],
                 messages: [userMsgRow, aiMsgRow],
                 message_requests: [requestRow],
                 message_responses: [responseRow],
                 message_outputs: [outputRow],
                 attachments
             };
             // If the conversation is new or untitled, and we have at least 4 turns (2 user + 2 assistant),
             // attempt to auto-title it. autoTitleConversation will fall back to a local heuristic when no
             // generateWithAI is provided.
             try {
                 const existingMsgs = (isGoogle ? updatedContents : updatedMessages) || [];
                 // count user+assistant pairs roughly: need at least 4 total messages in the UI
                 if ((!conv.title || conv.title === 'no title') && existingMsgs.length >= 4) {
                     const title = await autoTitleConversation({ messages: updatedMessages, contents: updatedContents, modelSelected, generateWithAI: undefined, language: (settings?.language || 'ar') });
                     if (title) {
                         conv.title = title;
                         // ensure the bundle includes the updated conversation so both local DB and server receive it
                         if (isNewConversation) bundle.conversations = [conv];
                         else bundle.conversations = [conv];
                         // Update UI conversations context
                         setConversations(prev => {
                             const base = prev && Array.isArray(prev.conversations) ? prev : { conversations: [], messages: [], message_requests: [], message_responses: [], message_outputs: [] };
                             const found = base.conversations.find(c => c.conversation_id === conv.conversation_id);
                             if (found) {
                                 const updated = base.conversations.map(c => c.conversation_id === conv.conversation_id ? { ...c, title: conv.title } : c);
                                 return { ...base, conversations: updated };
                             }
                             return { ...base, conversations: [conv, ...base.conversations] };
                         });
                     }
                 }
             } catch (e) { /* silently ignore title generation failures */ }
             try {
                 // التخزين حسب الخيار
                 if (storageOption === 'local') {
                     // حفظ فقط في indexedDB
                     refreshConversations(
                         bundle.conversations,
                         bundle.messages,
                         bundle.message_requests,
                         bundle.message_responses,
                         bundle.message_outputs,
                         bundle.attachments
                     );
                 } else if (storageOption === 'mixed') {
                     // Mixed storage avoidance: write locally first, then sync sequentially to server
                     refreshConversations(
                         bundle.conversations,
                         bundle.messages,
                         bundle.message_requests,
                         bundle.message_responses,
                         bundle.message_outputs,
                         bundle.attachments
                     );

                     if (auth?.data?.user_id) {
                         const convId = conv.conversation_id;
                         const nowTs = Date.now();
                         const last = lastSyncRef.current.get(convId) || 0;
                         // simple debounce within 300ms
                         if (nowTs - last < 300) {
                             // postpone slightly to coalesce bursts
                             setTimeout(() => {
                                 if (inflightByConv.current.get(convId)) return;
                                 inflightByConv.current.set(convId, true);
                                 const packet = buildServerSyncPacket(bundle);
                                 sendUserConversationsToServer(packet, auth)
                                     .then((serverData) => {
                                         // If server returns normalized rows with server IDs, we could reconcile here
                                         // For now, mark conversation as not local_only to indicate it exists server-side
                                         setConversations(prev => {
                                             const base = prev && Array.isArray(prev.conversations) ? prev : { conversations: [], messages: [], message_requests: [], message_responses: [], message_outputs: [] };
                                             const updated = base.conversations.map(c => c.conversation_id === convId ? { ...c, local_only: false } : c);
                                             return { ...base, conversations: updated };
                                         });
                                     })
                                     .finally(() => {
                                         inflightByConv.current.delete(convId);
                                         lastSyncRef.current.set(convId, Date.now());
                                     });
                             }, 320);
                         } else {
                             if (inflightByConv.current.get(convId)) {
                                 // already syncing this conv; let the queue handle next send
                             } else {
                                 inflightByConv.current.set(convId, true);
                                 const packet = buildServerSyncPacket(bundle);
                                 await sendUserConversationsToServer(packet, auth)
                                     .then((serverData) => {
                                         setConversations(prev => {
                                             const base = prev && Array.isArray(prev.conversations) ? prev : { conversations: [], messages: [], message_requests: [], message_responses: [], message_outputs: [] };
                                             const updated = base.conversations.map(c => c.conversation_id === convId ? { ...c, local_only: false } : c);
                                             return { ...base, conversations: updated };
                                         });
                                     })
                                     .finally(() => {
                                         inflightByConv.current.delete(convId);
                                         lastSyncRef.current.set(convId, Date.now());
                                     });
                             }
                         }
                     } else if (auth?.data?.anon_id || auth?.data?.temp_id) {
                         // Visitor path: send the same full packet (including attachments) using visitor endpoint
                         const convId = conv.conversation_id;
                         const nowTs = Date.now();
                         const last = lastSyncRef.current.get(convId) || 0;
                         const doSend = () => {
                             if (inflightByConv.current.get(convId)) return;
                             inflightByConv.current.set(convId, true);
                             const packet = buildServerSyncPacket(bundle);
                             sendVisitorConversationsToServer(packet, auth)
                                 .then(() => {
                                     // No local_only flip for visitors, but keep timestamp
                                 })
                                 .finally(() => {
                                     inflightByConv.current.delete(convId);
                                     lastSyncRef.current.set(convId, Date.now());
                                 });
                         };
                         if (nowTs - last < 300) setTimeout(doSend, 320); else doSend();
                     }
                 }
             } catch (_) { /* ignore */ }

         }catch (error){

             if (error.name === 'AbortError') {
                 logger.debug('chat', "🚫 تم إلغاء الطلب");
             } else {
                 console.error("❌ خطأ:", error);
                 // أظهر رسالة خطأ ودية للمستخدم
                 showToast(error?.message || t('chat.errors.connectionError'), 'error');
             }
         }finally {
             setIsLoading(false);
             setController(null);
             setText("");
             setFile(null);
             setFilePath(null);
             // اعتبر الرسائل الحالية مخزنة لتجنّب أي إعادة تشغيل للأنيميشن لاحقًا
             setIsStoredMessage(true);
         }

    }

  
    useEffect(()=>{
       if(filePath === ""){
           setDisplay("none");
       }else{
           setDisplay("block");
       }
    },[filePath])

    // update CSS variable used by home.css so the chat input recenters when drawer opens/closes
    useEffect(()=>{
       // Only show the uploaded preview area when there is a file (or a valid filePath)
       if (!file || file === null) {
           setDisplay("none");
           return;
       }
       // if a file exists, still hide if filePath is empty/null/undefined
       if (typeof filePath === 'undefined' || filePath === null || filePath === "") {
           setDisplay("none");
       } else {
           setDisplay("block");
       }
    },[file, filePath])
    return(

        <div className={"chat-field-container"}  style={{width:drawerOpen ? 'calc(100% - var(--drawer-width, 0px))' : '100%'}}>
            <Card className={"chat-field"}>
                <div className={"first-row-first-column"}>
                    <div className={"input-surface"}>
                        <div className={"input-row"}>
                            <div style={{display: display}} id={"imageUploaded"}>
                                <IconButton
                                    className="close-upload-btn"
                                    onClick={() => {
                                        setFilePath("");
                                        setFile(null);
                                    }}
                                    aria-label={t('chat.cancelPreview')}
                                    size="small"
                                >
                                    <Cancel fontSize="small"/>
                                </IconButton>
                                {(() => {
                                    let resolvedSrc = null;
                                    if (file?.type?.startsWith('image/')) {
                                        resolvedSrc = filePath || null;
                                    } else if (file?.type?.includes('pdf')) {
                                        resolvedSrc = '/file.png';
                                    } else if (file?.type && (file.type.includes('doc') || file.type.includes('docx'))) {
                                        resolvedSrc = '/doc.png';
                                    } else if (filePath) {
                                        resolvedSrc = filePath || null;
                                    }
                                    return (
                                        <img
                                            src={resolvedSrc || undefined}
                                            alt={t('chat.uploadedPreview')}
                                        />
                                    );
                                })()}
                                <div className="attachment-chip" title={file?.name || ''}>
                                    <div className="attachment-ext">
                                        {(file?.type?.split('/')?.[1] || (file?.type || 'FILE')).toUpperCase()}
                                    </div>
                                    <div className="attachment-meta">
                                        <div className="attachment-name">{file?.name || t('chat.attachment')}</div>
                                        <div className="attachment-type">{(file?.type || '').toUpperCase()}</div>
                                    </div>
                                </div>
                            </div>

                            <TextareaAutosize
                                id={"textarea-chat"}
                                value={text}
                                minRows={1}
                                maxRows={12}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage().then(r => {
                                            logger.debug('chat', r);
                                        });
                                        setText("");
                                    }
                                }}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v !== text) setText(v);
                                }}
                                placeholder={t('chat.placeholder')}
                                aria-label={t('chat.messageInputField')}
                            />
                        </div>
                        <div className="input-hints" aria-hidden>
                            {t('chat.inputHints')}
                        </div>
                    </div>
                </div>

                <div className={"first-row-second-column"}>
                    {isLoading ? (
                        <Tooltip title={t('chat.stop')} arrow>
                            <span>
                                <IconButton className="send-btn danger" onClick={() => controller?.abort()}>
                                    <Stop/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : (
                        <Tooltip title={t('chat.send')} arrow>
                            <span>
                                <IconButton
                                    className="send-btn"
                                    disabled={(text.trim().length === 0 && !file)}
                                    onClick={()=>{ handleSendMessage().then(r=>r); }}
                                >
                                    <Send/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </div>

                <div className={"first-column-second-row"}>
                    <div className="tools-left">
                        <UploadFileButton/>
                    </div>
                    <div className="tools-right">
                        <ModelsAutoComplete/>
                    </div>
                </div>
            </Card>
        </div>

    );

}