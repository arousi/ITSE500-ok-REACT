import {Dialog , DialogTitle , DialogContent , DialogActions , Button , useMediaQuery , useTheme , Typography , TextField} from "@mui/material";
import SharedButton from "../../../components/SharedButton";
import CustomSwitch from './CustomSwitch';
import { useAlert } from "../../dashboard/custom-hooks/useAlert";
import {useState } from 'react';
import { useTranslation } from 'react-i18next';
export default function DeleteOrArchiveAccountDialog({openDialog , setOpenDialog}) {
    const { t } = useTranslation();
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
            <DialogTitle>{t('profile.deleteDialog.title')}</DialogTitle>
            <DialogContent >
                <Typography sx={{fontSize:21 , textAlign:'start'}}>{t('profile.deleteDialog.chooseOption')}</Typography>
                <Typography sx={{fontSize:21 , textAlign:'start'}}>{t('profile.deleteDialog.deletingRemovesImmediately')}</Typography>
                <Typography sx={{fontSize:21 , textAlign:'start'}}>{t('profile.deleteDialog.noGuaranteeBackups')}</Typography>
                <TextField label={t('profile.deleteDialog.reasonFeedback')} variant="outlined" fullWidth multiline rows={4} />
                <div style={{display:'flex' , alignItems:'center', justifyContent:'space-between'}}>
                    <div>
                      <Typography sx={{fontSize: 30, marginTop: 2 ,  textAlign:'start'}}>
                       {t('profile.deleteDialog.permanentlyDeleteNow')}
                      </Typography>
                      <Typography sx={{fontSize: 23 ,  textAlign:'start'}}>{t('profile.deleteDialog.turnOffToArchive')}</Typography>
                     </div>
                    <CustomSwitch onChange={(event)=>{
                      setToggleCloseAccount(event.target.checked);
                    }} sx={{marginLeft: '30px' }}/>
                </div>
            </DialogContent>
                        <DialogActions>
                                <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
                                <SharedButton
                                    onClick={handleCloseAccount}
                                    color={toggleCloseAccount ? 'error' : 'primary'}
                                    sx={{ width: 200, height: 50 }}
                                >
                                    {toggleCloseAccount ? t('profile.deleteDialog.delete') : t('profile.deleteDialog.archive')}
                                </SharedButton>
                        </DialogActions>
        </Dialog>
    );
    function handleCloseAccount() {
       if(toggleCloseAccount){
           showAlert(true , 'warning', t('profile.deleteDialog.accountDeletion'), t('profile.deleteDialog.willBeDeleted'), 'DELETE');
       }else{
           showAlert(true , 'warning', t('profile.deleteDialog.accountArchival'), t('profile.deleteDialog.willBeArchived'), 'ARCHIVE');
       }
    }

}