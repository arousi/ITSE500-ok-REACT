import {Box} from "@mui/material";
import "../dashboard-style.css"
import {useContext} from "react";
import {OpenDrawerContext} from "../contexts/OpenDrawerContext";
export default function MainContainer({children}) {
    const { open } = useContext(OpenDrawerContext);
    const drawerWidth = 255;
    /*
     width: open ? 'calc(100% - 260px)' : '100%',
                marginLift: open ? '260px' : 0,
                transition: 'width 0.3s, margin 0.3s',
                boxShadow: 2
                */
    return (
        <Box

            sx={{
                overflowX:"hidden",
                width: open ? 'calc(100% - 350px)' : '100%',
                transition: 'width 0.3s position 0.3s'
        }}
            id="dashboard-container"
        >
            {children}
        </Box>
    );
}
