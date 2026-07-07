import { Radio, RadioGroup, Card, Typography, FormControlLabel } from '@mui/material';
import '../profile-styles.css';
import { useContext } from 'react';
import { OptionStorageContext } from '../contexts/OptionStorageContext';
import logger from '../../../core/logger';
export default function OptionsStorage() {
  const { storageOption, setStorageOption } = useContext(OptionStorageContext);
  return(
    <Card className={'section-provider-key'} sx={{ padding: 16, marginTop: 16 }}>
      <Typography sx={{ fontWeight: 600, marginBottom: 8 , fontSize:40 }}>Conversations Storage</Typography>
       
      <RadioGroup sx={{ fontSize:20, display:  'flex', flexDirection: 'row' , alignItems:"center" , justifyContent:"center" }} row name="conversations-storage"
      value={storageOption} onChange={(e)=>setStorageOption(e.target.value)}>
        <span style={{marginRight: '8px' , fontSize:"25px"}}>Select option : </span>
        <FormControlLabel value="local" onClick={() => {
          logger.debug('settings', "local storage option selected");

          }} sx={{fontSize:"25px"}}  control={<Radio  />} label="Local Only" />
        <FormControlLabel value="mixed" onClick={
          () => {
            logger.debug('settings', "mixed storage option selected");

          }
          } sx={{fontSize:"25px"}} control={<Radio />} label="Mixed Only" />
      </RadioGroup>
    </Card>
  );

}