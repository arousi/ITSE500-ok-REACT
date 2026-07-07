import React from 'react';
import { Button } from '@mui/material';

// Reusable button with theme-aligned defaults and partial curvature
const SharedButton = React.forwardRef(function SharedButton(
  {
    children,
    color = 'primary',
    variant = 'contained',
    rounded = 10,
    sx = {},
    ...props
  },
  ref
){
  return (
    <Button
      ref={ref}
      variant={variant}
      color={color}
      sx={{
        borderRadius: rounded,
        textTransform: 'capitalize',
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
});

export default SharedButton;
