import { Person } from "@mui/icons-material";
import "../home.css";
import ReactMarkdown from "react-markdown";

export default function UserMessage({ text, image = "", mimeType = "" }) {
    const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");
    const isPdf = typeof mimeType === "string" && mimeType.toLowerCase().includes("pdf");
    const isDoc =
        typeof mimeType === "string" &&
        (mimeType.toLowerCase().includes("msword") || mimeType.toLowerCase().includes("wordprocessingml") || mimeType.toLowerCase().includes("vnd.openxmlformats-officedocument.wordprocessingml"));

    const previewSrc = isImage ? image : isPdf ? "/file.png" : isDoc ? "/doc.png" : image;

    return (
        <div id="user-message">
          
            <div>
                <ReactMarkdown>{text || ""}</ReactMarkdown>
                {image ? (
                    <div id="user-image-container" style={{ display: image ? "block" : "none" }}>
                        {/* If not an image, show representative icon; else render the image */}
                        {isImage ? (
                            <img src={previewSrc} alt="user-attachment" />
                        ) : (
                            <img src={previewSrc} alt="user-attachment-icon" />
                        )}
                    </div>
                ) : null}
            </div>
              <Person sx={{width:"40px", height:"40px" }}/>
        </div>
    );
}