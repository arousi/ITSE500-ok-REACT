import { Radio, RadioGroup, Card, Typography, FormControlLabel } from '@mui/material';
import '../profile-styles.css';
import { useContext } from 'react';
import { OptionStorageContext } from '../contexts/OptionStorageContext';
import logger from '../../../core/logger';
import { useTranslation } from 'react-i18next';
export default function OptionsStorage() {
  const { t } = useTranslation();
  const { storageOption, setStorageOption } = useContext(OptionStorageContext);
  return(
    <Card className={'section-provider-key'} sx={{ padding: 16, marginTop: 16 }}>
      <Typography sx={{ fontWeight: 600, marginBottom: 8 , fontSize:40 }}>{t('profile.conversationsStorage')}</Typography>

      <RadioGroup sx={{ fontSize:20, display:  'flex', flexDirection: 'row' , alignItems:"center" , justifyContent:"center" }} row name="conversations-storage"
      value={storageOption} onChange={(e)=>setStorageOption(e.target.value)}>
        <span style={{marginRight: '8px' , fontSize:"25px"}}>{t('profile.selectOption')}</span>
        <FormControlLabel value="local" onClick={() => {
          logger.debug('settings', "local storage option selected");

          }} sx={{fontSize:"25px"}}  control={<Radio  />} label={t('profile.localOnly')} />
        <FormControlLabel value="mixed" onClick={
          () => {
            logger.debug('settings', "mixed storage option selected");

          }
          } sx={{fontSize:"25px"}} control={<Radio />} label={t('profile.mixedOnly2')} />
      </RadioGroup>
    </Card>
  );

}