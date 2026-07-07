import {Outlet} from "react-router-dom";
import {Box} from "@mui/material";
import {AuthAppBar} from "../Components/AuthAppBar";
export default function VisitorContainer() {
    return(
        <Box sx={{width:"100%", height:"100%"}}>
            <AuthAppBar/>
            <Outlet/>
        </Box>
    )
}