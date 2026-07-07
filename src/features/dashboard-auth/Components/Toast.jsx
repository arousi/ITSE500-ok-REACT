import {Alert , Snackbar} from "@mui/material"
import {useToast} from "../custom-hooks/useToast";
export default function Toast() {
    const {toast  , closeToast} = useToast();
    return (
        <Snackbar open={toast.open} autoHideDuration={4000} onClose={()=>{
            closeToast();
        }}>
            <Alert
                onClose={()=>{
                    closeToast();
                }}
                severity={toast.type}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {toast.content}
            </Alert>
        </Snackbar>
    )
}