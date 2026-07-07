import { Dialog, DialogContent } from "@mui/material";

import RegisterPage from "../registerUI/RegisterPage"; 
export default function RegisterDialog({ open, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogContent>
                <RegisterPage />
            </DialogContent>
        </Dialog>
    );
}

    

