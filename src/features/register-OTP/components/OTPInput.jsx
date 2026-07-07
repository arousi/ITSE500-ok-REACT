import {useRef, useState} from "react";
import {Box, TextField} from "@mui/material";

export default function OTPInput({length = 6, onComplete}) {
    const [otp, setOtp] = useState(Array(length).fill(''));
    const inputsRef = useRef([]);

    const handleChange = (e, index) => {
        const value = e.target.value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < length - 1) {
            inputsRef.current[index + 1].focus();
        }

        if (newOtp.every(char => char !== '')) {
            onComplete && onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    return (
        <Box display="flex" gap={1} justifyContent="center">
            {otp.map((value, i) => (
                <TextField
                    key={i}
                    inputProps={{maxLength: 1, style: {textAlign: 'center'}}}
                    value={value}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    inputRef={(ref) => inputsRef.current[i] = ref}
                    variant="outlined"
                    size="small"
                />
            ))}
        </Box>
    );
}