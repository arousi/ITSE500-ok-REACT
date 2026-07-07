import { useEffect, useState, useMemo } from "react";
import "../home.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SmartToy, ContentCopy, Download } from "@mui/icons-material";
import { Tooltip, Button, IconButton, CircularProgress } from "@mui/material";

export default function AIMessage({ text, typing = false, animate = false, image, filePath, fileType, waiting = false, statusText = '' }) {
    const [displayText, setDisplayText] = useState("");
    const [copied, setCopied] = useState(false);

    const imgSrc = useMemo(() => {
        const isStr = (v) => typeof v === "string" && v.trim().length > 0;
        const looksUrl = (v) => v.startsWith("http") || v.startsWith("blob:");
        const looksDataUrl = (v) => v.startsWith("data:");

        // Normalize any input (bare base64, data URL, or URL) into a proper usable src
        const normalizeToDataUrl = (input, mimeHint) => {
            if (!isStr(input)) return "";
            const s = input.trim();
            if (looksUrl(s)) return s; // http(s) or blob URL
            const fallbackMime = mimeHint || "image/png";
            if (looksDataUrl(s)) {
                // If the string already contains a data URL, ensure only one header and a clean base64 body
                const firstComma = s.indexOf(",");
                if (firstComma === -1) return s; // malformed, but pass through
                const header = s.slice(5, firstComma); // after 'data:' up to first comma
                // Take the last segment after the last comma in case of duplicated prefixes
                const base = s.slice(s.lastIndexOf(",") + 1).replace(/\s+/g, "");
                return `data:${header},${base}`;
            }
            // Bare base64 or accidentally includes an inner data:* prefix -> strip and rebuild
            const cleaned = s.replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
            return `data:${fallbackMime};base64,${cleaned}`;
        };

        const mime = fileType || (isStr(filePath) && looksDataUrl(filePath) ? filePath.split(":")[1]?.split(";")[0] || "image/png" : "image/png");

        if (isStr(image)) return normalizeToDataUrl(image, mime);
        if (isStr(filePath)) return normalizeToDataUrl(filePath, mime);
        return "";
    }, [image, filePath, fileType]);

    const handleCopy = async () => {
        const str = displayText || "";
        const fallbackCopy = (s) => {
            const ta = document.createElement("textarea");
            ta.value = s;
            ta.style.position = "fixed";
            ta.style.top = "-1000px";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand("copy"); } catch (e) {}
            document.body.removeChild(ta);
        };
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(str);
            } else {
                fallbackCopy(str);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {
            fallbackCopy(str);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    useEffect(() => {
        if (!text) return;
        setDisplayText("");
        if (!animate) { setDisplayText(text); return; }
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) { index++; setDisplayText(text.slice(0, index)); }
            else { clearInterval(interval); }
        }, 5);
        return () => clearInterval(interval);
    }, [text, animate]);

    const CodeRenderer = useMemo(() => (args) => {
        const { inline, className, children, ...props } = args;
        const codeText = String(children ?? '').replace(/\n$/, '');
        if (inline) {
            return (
                <code style={{ background: '#f5f5f5', padding: '0.15rem 0.35rem', borderRadius: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }} {...props}>{children}</code>
            );
        }
        const lang = /language-([\w-]+)/.exec(className || '')?.[1] || 'text';
        const copyBlock = async () => {
            try {
                if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(codeText); }
                else {
                    const ta = document.createElement('textarea');
                    ta.value = codeText; ta.style.position = 'fixed'; ta.style.top = '-1000px';
                    document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); } catch (_) {}
                    document.body.removeChild(ta);
                }
            } catch (_) {}
        };
        return (
            <div style={{ border: '1px solid #1f2937', borderRadius: 6, overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827', color: '#e5e7eb', padding: '6px 10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12 }}>
                    <span>{lang}</span>
                    <Tooltip title="code copy"><span><IconButton size="small" onClick={copyBlock} sx={{ color: '#e5e7eb' }}><ContentCopy fontSize="inherit" /></IconButton></span></Tooltip>
                </div>
                <pre style={{ margin: 0, background: '#0b1220', color: '#e5e7eb', padding: '10px 12px', overflowX: 'auto' }}>
                    <code className={className} {...props}>{codeText}</code>
                </pre>
            </div>
        );
    }, []);

    const Table = (props) => (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }} {...props} />
        </div>
    );
    const Th = (props) => <th style={{ border: '1px solid #e0e0e0', padding: 6, background: '#fafafa' }} {...props} />;
    const Td = (props) => <td style={{ border: '1px solid #e0e0e0', padding: 6 }} {...props} />;

    return (
        <div id={"ai-message"}>
            <SmartToy sx={{width:"40px", height:"40px" }}/>
            <div>
                {waiting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                        <CircularProgress size={18} thickness={4} />
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{statusText || 'جاري المعالجة...'}</div>
                    </div>
                ) : typing ? (
                    <div className="typing"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                ) : (
                    <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeRenderer, table: Table, th: Th, td: Td }}>
                            {displayText}
                        </ReactMarkdown>
                        <div className="image-container" style={{ display: imgSrc ? 'block' : 'none', marginTop: 8  }}>
                            <img src={imgSrc || ''} alt="AI Output" style={{objectFit:"contain" , height: '80%' ,  width: '100%', borderRadius: 8, border: '1px solid #e0e0e0' }} />
                            {imgSrc && (
                                <div style={{ marginTop: 6 }}>
                                    <Tooltip title="تنزيل الصورة"><span>
                                        <Button sx={{textTransform:'capitalize'}} size="small" variant="outlined" startIcon={<Download/>} onClick={() => {
                                            try{ const href = imgSrc; const a = document.createElement('a'); a.href = href; a.download = `ai-image.${(fileType||'image/png').split('/')[1] || 'png'}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);}catch(_){ }
                                        }}>Download</Button>
                                    </span></Tooltip>
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Tooltip title={copied ? "تم النسخ!" : "نسخ المحتوى"}><span>
                                <Button size="small" variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy} disabled={!displayText} sx={{textTransform:'capitalize'}}>
                                    copy
                                </Button>
                            </span></Tooltip>
                            {copied && <span style={{ marginInlineStart: 8, fontSize: 12, color: '#4caf50' }}>تم النسخ</span>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}