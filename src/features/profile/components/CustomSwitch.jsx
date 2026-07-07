import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

const CustomSwitch = styled(Switch)(({ theme }) => ({
    width: 48,
    height: 26,
    padding: 0,
    display: "flex",
    "& .MuiSwitch-switchBase": {
        padding: 2,
        "&.Mui-checked": {
            transform: "translateX(22px)",
            color: "#fff",
            "& + .MuiSwitch-track": {
                opacity: 1,
                backgroundColor: "#4caf50", // لون الخلفية عند التفعيل
                border: "1px solid #4caf50"
            }
        }
    },
    "& .MuiSwitch-thumb": {
        width: 22,
        height: 22,
        boxShadow: "0px 1px 3px rgba(0,0,0,0.4)",
        backgroundColor: "#fff"
    },
    "& .MuiSwitch-track": {
        borderRadius: 26 / 2,
        opacity: 1,
        backgroundColor: "#ccc", // لون الخلفية عند الإيقاف
        border: "1px solid #999",
        boxSizing: "border-box"
    }
}));

export default CustomSwitch;