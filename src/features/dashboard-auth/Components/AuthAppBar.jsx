import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Link } from "react-router-dom";
import "../components-style.css"
import '../../visitor-home-page/chat-field-style.css'
import { useContext, useState } from "react";
import { IconButton } from "@mui/material";
import { Menu, Settings, MoreVert } from "@mui/icons-material"
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuItem from '@mui/material/MenuItem';
import MuiMenu from '@mui/material/Menu';
import { OpenDrawerContext } from "../../visitor-home-page/contexts/OpenDrawerContext";
export function AuthAppBar() {
    const { setOpen } = useContext(OpenDrawerContext);
    const isSmall = useMediaQuery('(max-width:640px)');
    const [moreEl, setMoreEl] = useState(null);
    const iconSize = isSmall ? 28 : 40;

    return (

        <AppBar position="static">
            <Toolbar id="app-bar">
                <div id={"right-button"}>
                    <IconButton onClick={() => { setOpen(true); }} >
                        <Menu sx={{ width: iconSize, height: iconSize }} />
                    </IconButton>
                    {isSmall ? (
                        <>
                            <IconButton onClick={(e) => setMoreEl(e.currentTarget)} aria-label="more">
                                <MoreVert sx={{ width: iconSize, height: iconSize }} />
                            </IconButton>
                            <MuiMenu
                                anchorEl={moreEl}
                                open={Boolean(moreEl)}
                                onClose={() => setMoreEl(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem component={Link} to={'/visitor/visitor-settings'} onClick={() => setMoreEl(null)}>Settings</MenuItem>
                                <MenuItem component={Link} to={'/login'} onClick={() => setMoreEl(null)}>Login</MenuItem>
                                <MenuItem component={Link} to={'/register'} onClick={() => setMoreEl(null)}>Register</MenuItem>
                            </MuiMenu>
                        </>
                    ) : (
                        <IconButton component={Link} to={"/visitor/visitor-settings"}>
                            <Settings sx={{ width: iconSize, height: iconSize }} />
                        </IconButton>
                    )}
                </div>
                {!isSmall && (
                    <div id="left-buttons">
                        <Button id={"loginBtn"} component={Link} to={"/login"} >login</Button>
                        <Button id={"registerBtn"} component={Link} to={"/register"} >register</Button>
                    </div>
                )}
            </Toolbar>
        </AppBar>
    );
}