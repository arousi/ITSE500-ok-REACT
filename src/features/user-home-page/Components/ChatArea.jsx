import "../home.css"
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import {useContext, useEffect , useState, useRef} from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { IconButton } from "@mui/material";
import {SendMessageContext} from "../contexts/SendMessageContext";
import {UserProfileContext} from "../../profile/contexts/UserProfileProvider";
import {ModelSelectedContext} from "../contexts/ModelSelectedContext";
import { useParams } from "react-router-dom";
import { readConversationBundle, updateConversationTitle } from "../logic/connectIndexedDB";
import { reconstructUIFromBundle } from "../logic/conversationOperations";
import { IsStoredAIMessageContext } from "../contexts/IsStoredAIMessageContext";
import { useAuth } from "../../register/contexts/UserProvider";
import logger from "../../../core/logger";
import { useTranslation } from "react-i18next";
export default function ChatArea() {
    const { t } = useTranslation();
    const {messages, contents, isLoading, setMessages, setContents} = useContext(SendMessageContext);
    const {userProfile} = useContext(UserProfileContext);
    const {modelSelected, setModelSelected} = useContext(ModelSelectedContext);
    const { conversationId } = useParams();
    const { setIsStoredMessage } = useContext(IsStoredAIMessageContext);
    const { auth } = useAuth();
    const [display , setDisplay] = useState(false);
    const chatAreaRef = useRef(null);
    // Load selected conversation's messages from IndexedDB on route change
    useEffect(() => {
        let cancelled = false;
        if (!conversationId) return;
        const ownerUserId = auth?.data?.user_id || '';
        const ownerVisitorId = auth?.data?.anon_id || (typeof localStorage !== 'undefined' ? (localStorage.getItem('visitor_id') || '') : '');
        readConversationBundle(conversationId, { user_id: ownerUserId, visitor_id: ownerVisitorId })
            .then(bundle => {
                if (cancelled) return;
                if (!bundle) {
                    // Not accessible or not found: clear UI
                    setMessages([]);
                    setContents([]);
                    return;
                }
                const ui = reconstructUIFromBundle(bundle);
                setMessages(Array.isArray(ui.messages) ? ui.messages : []);
                setContents(Array.isArray(ui.contents) ? ui.contents : []);
                // رسائل محمّلة من التخزين/الخادم -> لا تأثير كتابة
                setIsStoredMessage(true);
                if (ui.provider) {
                    setModelSelected(prev => ({ ...prev, provider: ui.provider, name: ui.model || prev.name }));
                }
            })
            .catch(() => {/* ignore */});
        return () => { cancelled = true; };
    }, [conversationId, setMessages, setContents, setModelSelected, setIsStoredMessage, auth?.data?.user_id, auth?.data?.anon_id]);

    // Title rule (concise like ChatGPT):
    // - Wait until there are TWO user messages.
    // - Title is derived ONLY from the SECOND user message, 2–5 words, no emojis/punct.
    useEffect(() => {
        if (!conversationId) return;

        // Gather user-only texts from messages/contents
        const extractUserTexts = () => {
            const out = [];
            const collect = (arr, isGoogle) => {
                for (const item of (arr || [])) {
                    const d = item?.data || {};
                    const role = isGoogle ? (d.role || item.role) : (d.role || item.role);
                    if (role !== 'user') continue;
                    let text = '';
                    if (isGoogle) {
                        const parts = Array.isArray(d.parts) ? d.parts : [];
                        text = parts.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                    } else {
                        const c = d.content;
                        if (typeof c === 'string') text = c;
                        else if (Array.isArray(c)) text = c.map(p => p?.text || '').filter(Boolean).join(' ').trim();
                        else text = '';
                    }
                    if (text) out.push(text);
                    if (out.length >= 2) break;
                }
            };
            collect(messages, false);
            if (out.length < 2) collect(contents, true);
            return out;
        };

        const userTexts = extractUserTexts();
        if (userTexts.length < 2) {
            updateConversationTitle(conversationId, 'no title').catch(() => {});
            return;
        }

        const second = userTexts[1];
        const stripEmojis = (s) => s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    const stripPunct = (s) => s.replace(/[\u061F\u060C\u061B!"'`’“”«»(),.:;{}<>ـ_=+\\/-]/g, ' ');
        const normalize = (s) => s.replace(/\s+/g, ' ').trim();

        const stopwordsAr = new Set(['من','في','على','عن','إلى','الى','و','أو','ثم','هذا','هذه','ذلك','تلك','هناك','هنا','ما','ماذا','كيف','لماذا','مع','قد','لقد','لا','لم','لن','إن','أن','كان','كانت','كانوا','هي','هو','هم','هن','كل','أي','أيضاً','ايضا','بعد','قبل','بين','بدون','غير','مثل','حول']);
        const stopwordsEn = new Set(['the','a','an','and','or','of','to','for','in','on','with','about','from','by','at','as','is','are','be','was','were','this','that','these','those']);

        const cleaned = normalize(stripPunct(stripEmojis(second)));
        const words = cleaned.split(' ').filter(Boolean);
        const preferAr = /[\u0600-\u06FF]/.test(cleaned);
        const filtered = words.filter(w => {
            const t = w.toLowerCase();
            return preferAr ? !stopwordsAr.has(t) : !stopwordsEn.has(t);
        });
        const top = (filtered.length ? filtered : words).slice(0, 5).join(' ');
        const title = normalize(top).slice(0, 48) || 'no title';

        updateConversationTitle(conversationId, title).catch(() => {});
    }, [conversationId, messages, contents]);
    // زر الصعود للأعلى: يدعم التمرير داخل الحاوية أو تمرير الصفحة نفسها
    useEffect(() => {
        const el = chatAreaRef.current;
        const onScroll = () => {
            const containerTop = el ? el.scrollTop : 0;
            const winTop = window.scrollY || document.documentElement.scrollTop || 0;
            const show = containerTop > 300 || winTop > 300;
            setDisplay(prev => (prev === show ? prev : show));
        };
        if (el) el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => {
            if (el) el.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);
    return (
        <div className="chat-area" ref={chatAreaRef}>
            {
                ((modelSelected?.provider || '').toLowerCase() === "openrouter" || (modelSelected?.provider || '').toLowerCase() === "openai" || (modelSelected?.provider || '').toLowerCase() === "lm_studio") ? (
                    messages.length > 0 ?
                        <>
                            {messages.map((message, index) => renderMessage(message, index))}
                            {isLoading && messages.length > 0 && messages[messages.length - 1]?.data?.role === "user" && (
                                <AIMessage key={"typing-openrouter"} typing text={""}/>
                            )}
                        </>
                        :
                        renderWelcomeMessage(userProfile.first_name)
                ) : ((modelSelected?.provider || '').toLowerCase() === "google") ? (
                    contents.length > 0 ?
                        <>
                            {contents.map((message, index) => renderContent(message, index))}
                            {isLoading && contents.length > 0 && contents[contents.length - 1]?.data?.role === "user" && (
                                <AIMessage key={"typing-google"} typing text={""}/>
                            )}
                        </>
                        :
                        renderWelcomeMessage(userProfile.first_name)
                ) : (
                    renderWelcomeMessage(userProfile.first_name)
                )
            }
            { (
                <IconButton
                    sx={{
                        width:'75px', 
                        height:"75px",
                        fontSize:"30px",
                        display: display ? 'flex' : 'none',
                        position: 'fixed',
                        bottom: '196px', /* فوق منطقة الإدخال الثابتة */
                        right: 'auto',
                        backgroundColor: 'var(--chat-surface)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                        border: '1px solid var(--chat-border)',
                        zIndex: 1500,
                        transition: 'opacity 160ms ease, transform 160ms ease',
                        '&:hover': { backgroundColor: 'var(--chat-surface)', transform: 'translateY(-2px)' }
                    }}
                    size="small"
                    onClick={() => {
                        const el = chatAreaRef.current;
                        if (el && el.scrollTop > 0) {
                            el.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        // أيضاً لو الصفحة نفسها متحركة
                        if ((window.scrollY || document.documentElement.scrollTop) > 0) {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    aria-label={t('chat.scrollToTop')}
                >
                    <ArrowUpwardIcon fontSize="large" />
                </IconButton>
            ) }
        </div>
    );

    function renderMessage(message, index) {
        const {role, content} = message.data;
        const text = typeof content === "string" ? content : content[0]?.text;
        const image = normalizeToDataUrl(message.filePath || "", message.fileType);

    return role === "user" ? (
            <UserMessage key={message.cid || index} text={text} image={image} mimeType={message.fileType}/>
        ) : (
    <AIMessage key={message.cid || index} text={text} animate={!!message.animate} filePath={image} fileType={message.fileType}/>
        );
    }
     
    // أزيلت الدالة القديمة التي كانت تعتمد على window وتؤدي إلى تبديل متكرر للحالة
    function renderContent(message, index) {
        const parts = Array.isArray(message?.data?.parts) ? message.data.parts : [];
        const text = parts.find(p => typeof p?.text === 'string')?.text || '';
        logger.debug('chat', message)
    // Find image-like part: inline_data or file_data (snake/camel) or media-wrapped variants
    const imgPart = parts.find(p => p?.inline_data || p?.file_data || p?.inlineData || p?.fileData || p?.media?.inline_data || p?.media?.file_data || p?.media?.inlineData || p?.media?.fileData) || {};
    const inline = imgPart.inline_data || imgPart.inlineData || imgPart.media?.inline_data || imgPart.media?.inlineData || null;
    const fileData = imgPart.file_data || imgPart.fileData || imgPart.media?.file_data || imgPart.media?.fileData || null;
     
        const mime = (inline?.mime_type || inline?.mimeType || fileData?.mime_type || fileData?.mimeType || message.fileType || 'image/png');
        const base64 = inline?.data || '';
        const fileUri = fileData?.file_uri || fileData?.uri || fileData?.fileUrl || '';

        // Prefer precomputed filePath (data URL) if present; then inline base64; then file URI/URL
        const aiSrcRaw = message.filePath
            || (typeof base64 === 'string' && base64 ? base64 : '')
            || (typeof fileUri === 'string' && fileUri ? fileUri : '');
        const aiSrc = normalizeToDataUrl(aiSrcRaw, mime);

        // For user message, show their attached image if present (filePath or inline)
        const userImageRaw = message.filePath
            || (inline && base64 ? base64 : '')
            || (typeof fileUri === 'string' ? fileUri : '');
        const userImage = normalizeToDataUrl(userImageRaw, mime);

        return message.data.role === "user" ? (
            <UserMessage
                key={message.cid || index}
                text={text}
                image={userImage}
                mimeType={mime}
            />
        ) : (
            <AIMessage key={message.cid || index} text={text} filePath={aiSrc} fileType={mime} animate={!!message.animate} />
        );
    }

    function renderWelcomeMessage(firstName) {
        return (
            <div style={{height: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <span style={{fontSize: "30px", fontWeight: "bold"}}>
                {t('chat.welcomeMessage', { name: firstName })}
            </span>
            </div>
        );
    }
} 

// Normalize any candidate image source (bare base64, existing data URL, or http/blob URL)
function normalizeToDataUrl(input, mimeHint) {
    if (!input || typeof input !== 'string') return '';
    const s = input.trim();
    if (!s) return '';
    if (s.startsWith('http') || s.startsWith('blob:')) return s;
    const fallbackMime = mimeHint || 'image/png';
    if (s.startsWith('data:')) {
        const firstComma = s.indexOf(',');
        if (firstComma === -1) return s; // malformed
        const header = s.slice(5, firstComma); // after 'data:'
        const base = s.slice(s.lastIndexOf(',') + 1).replace(/\s+/g, '');
        return `data:${header},${base}`;
    }
    // If it accidentally contains an inner data:* prefix, strip it
    const cleaned = s.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    return `data:${fallbackMime};base64,${cleaned}`;
}