import {Avatar, TextField, Card, Divider, Typography, Button} from "@mui/material"
import "../forgot-password-style.css"
import OTPInput from "../components/OTPInput";
import {Link} from "react-router-dom";

export default function ForgotPasswordPage() {
    const handleOTPComplete = (code) => {
        console.log('تم إدخال:', code);
        // يمكن متابعة ما تريد فعله هنا بعد إدخال الكود كاملاً
    };

    return (
        <Card id="forgot-password-card">
            <div id="header">
                <Avatar />
                <Divider />
            </div>
            <div id="body">
                <Typography variant="h4">Confirmation code</Typography>
                <OTPInput onComplete={handleOTPComplete} />
                <TextField label={"New password"} />
                <TextField  label={"Confirm password"}/>
            </div>
            <div id="footer">
                <Typography variant={"h5"}>Return to <Typography variant={"h5"} sx={{textDecoration:"none"}} component={Link} to={"/login"}>the login page</Typography></Typography>
                <Typography variant={"h5"}>Return to <Typography variant={"h5"} sx={{textDecoration:"none"}} component={Link} to={"/register"}>the register page</Typography></Typography>
                <p>or</p>
                <Button className={"register-buttons"} component={Link} to={"/visitor-home-page"} variant={"contained"}>Continue as guest</Button>
            </div>
        </Card>
    );
}
