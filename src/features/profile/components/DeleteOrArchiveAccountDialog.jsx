import {Dialog , DialogTitle , DialogContent , DialogActions , Button , useMediaQuery , useTheme , Typography , TextField} from "@mui/material";
import SharedButton from "../../../components/SharedButton";
import CustomSwitch from './CustomSwitch';
import { useAlert } from "../../dashboard/custom-hooks/useAlert";
import {useState } from 'react';
export default function DeleteOrArchiveAccountDialog({openDialog , setOpenDialog}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [toggleCloseAccount , setToggleCloseAccount] = useState(false); 
    const {showAlert} = useAlert();
    return (
        <Dialog fullScreen={fullScreen}  PaperProps={{
                sx: {
                    borderRadius: 2,
                    // fixed height on desktop, full height on small screens
                    height: fullScreen ? '100vh' : '70vh',
                    maxHeight: fullScreen ? '100vh' : 900,
                    width: fullScreen ? '100%' : '80%',
                }
            }} open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Close your Account</DialogTitle>
            <DialogContent >
                <Typography sx={{fontSize:21 , textAlign:'start'}}>Choose an option below Archive disable access and schedules deletion ~30 days .</Typography>
                <Typography sx={{fontSize:21 , textAlign:'start'}}>Deleting removes your account immediately.</Typography>
                <Typography sx={{fontSize:21 , textAlign:'start'}}>There is no guarantee your account data will be removed from our past DB Backups.</Typography>
                <TextField label="Reason / Feedback (optional)" variant="outlined" fullWidth multiline rows={4} />
                <div style={{display:'flex' , alignItems:'center', justifyContent:'space-between'}}>
                    <div>
                      <Typography sx={{fontSize: 30, marginTop: 2 ,  textAlign:'start'}}>
                       Permanently Delete now
                      </Typography>
                      <Typography sx={{fontSize: 23 ,  textAlign:'start'}}>Turn off to archive instead</Typography>
                     </div>
                    <CustomSwitch onChange={(event)=>{
                      setToggleCloseAccount(event.target.checked);
                    }} sx={{marginLeft: '30px' }}/>
                </div>
            </DialogContent>
                        <DialogActions>
                                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                                <SharedButton
                                    onClick={handleCloseAccount}
                                    color={toggleCloseAccount ? 'error' : 'primary'}
                                    sx={{ width: 200, height: 50 }}
                                >
                                    {toggleCloseAccount ? 'Delete' : 'Archive'}
                                </SharedButton>
                        </DialogActions>
        </Dialog>
    );
    function handleCloseAccount() {
       if(toggleCloseAccount){
           showAlert(true , 'warning', 'account deletion', "Your account will be permanently deleted.", 'DELETE');
       }else{
           showAlert(true , 'warning', 'account archival', "Your account will be archived.", 'ARCHIVE');
       }
    }

}