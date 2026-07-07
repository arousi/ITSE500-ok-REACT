import {Card, Typography, Box} from "@mui/material";
import "../profile-styles.css"

export default function CategoryModelsCard({ categoryName, count, model }) {
    // if `model` prop is passed, render a model card (name + provider)
    if (model) {
        return (
            <Card className={"card-category-models"} style={{padding:12}}>
                <Typography className={"title-category-card"} style={{fontWeight:600}}>{model.name}</Typography>
                <Typography className={'count-models'} style={{fontSize:12, color:'#666'}}>{model.provider}</Typography>
            </Card>
        )
    }

    // default: category summary card
    return (
        <Card className={"card-category-models"} style={{padding:12, display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'center'}}>
            <Box>
                <Typography className={"title-category-card"} style={{fontWeight:600}}>{categoryName}</Typography>
                <Typography className={'count-models'} style={{fontSize:12, color:'#666'}}>{count}</Typography>
            </Box>
        </Card>
    )
}