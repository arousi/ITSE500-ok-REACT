import {Card, Avatar, Divider, TextField, Typography, Button} from "@mui/material";
import "../register-otp-styles.css"
import OTPInput from "../components/OTPInput";
import {Link} from "react-router-dom";
export default function RegisterOTPPage() {
    return(
        <Card id={"register-otp-card"}>
            <div className={"header"}>
                <Avatar/>
            </div>
            <div id={"body"}>
                <TextField label={"username"} />
                <TextField label={"Email or Phone"} />
                <Typography id={"title-otp"}>Confirmation code</Typography>
                <OTPInput/>
                <Divider/>
            </div>
            <div id={"footer"}>
              <Typography   className={"text-register"}>Already user ? <Typography className={"text-register"} component={Link} to={"/login"}>login</Typography></Typography>
              <Typography  className={"text-register"} component={Link} to={"forgot-password"}>Forgot password?</Typography>
                <p>or</p>
                <Button component={Link} id={"visitor-button"} to={"/visitor-home-page"} variant={"contained"}>Continue as guest</Button>
            </div>
        </Card>
    )
}