
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import {Add } from '@mui/icons-material';
import {useContext, useState} from 'react';
import {URLFileContext} from "../contexts/URLFileProvider";
import {FileContext} from "../contexts/FileProvider";
import { useTranslation } from "react-i18next";
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});


export default function UploadFileButton(){
    const { t } = useTranslation();
    const {setFilePath} = useContext(URLFileContext);

    const {setFile} = useContext(FileContext);
    const [isUploading, setIsUploading] = useState(false);

    function selectFile(event){
        const files = event.target.files;
        if(!files || files.length === 0){
            setIsUploading(false);
            return;
        }

        setIsUploading(true);
        const file = files[files.length - 1];
    if(file instanceof File || file instanceof Blob){
            const fileUrl = URL.createObjectURL(file);
            setFilePath(fileUrl);
            convertImageToBase64(file , function(base64 , type){
                const fileObject = {
            base64,
            type,
            name: (file && file.name) ? file.name : '',
            size: (file && typeof file.size === 'number') ? file.size : undefined
                }
                setFile(fileObject);
                setIsUploading(false);
            });
        } else {
            setIsUploading(false);
        }
    }

    function convertImageToBase64(file , callback) {
        const reader = new FileReader();
        reader.onload = function () {
            callback(reader.result , file.type); // هذا هو الـ Base64 الناتج
        };
        reader.onerror = function () {
            // في حال فشل القراءة، أخفِ مؤشر التحميل
            setIsUploading(false);
        }
        reader.readAsDataURL(file);
    }

    return(
        <div className={`upload-button ${isUploading ? 'loading' : ''}`}>
            <IconButton
                role={undefined}
                component={"label"}
                tabIndex={-1}
                sx={{width:40 , height:40}}
                disabled={isUploading}
                aria-busy={isUploading}
                aria-label={isUploading ? t('chat.uploading') : t('chat.uploadFile')}
            >
                <Add sx={{width:40 , height:40}}/>
                <VisuallyHiddenInput
                    type="file"
                    accept={"image/*,.pdf,.doc,.docx,.odt"}
                    onChange={(event) => selectFile(event)}
                    multiple
                />
            </IconButton>
            <span className="upload-spinner" aria-hidden={!isUploading}></span>
        </div>
    );
}