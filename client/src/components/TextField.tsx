import {
  TextField as StockTextField,
  type TextFieldProps,
} from '@mui/material';
import * as React from 'react';
import { blue, grey, red } from '@mui/material/colors';

const CustomTextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  ({ sx, error, ...props }, ref) => (
    <StockTextField
      size="small"
      ref={ref}
      inputRef={ref}
      fullWidth
      error={error}
      slotProps={{
        ...props.slotProps,
        inputLabel: {
          error,
          sx: [!error && { color: grey }],
        },
      }}
      sx={{
        borderRadius: '10px',
        fontSize: '14px',
        background: '#ffffff',
        '.MuiInputBase-root': {
          minHeight: '42px',
          fontSize: 'inherit',
          borderRadius: 'inherit',
          color: '#000000',
        },
        '.MuiInputLabel-root': {
          lineHeight: '1.75em',
          fontSize: '14px',
        },
        'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus':
          {
            transition: 'background-color 999999s ease-in-out 0s',
          },
        input: {
          paddingY: 1.5,
          paddingX: 2,
          boxSizing: 'border-box',
          minHeight: 'inherit',
          height: '100%',
          '&::placeholder': {
            fontSize: '14px',
            opacity: 1,
            color: grey.A400,
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...sx?.input,
        },
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused fieldset': {
            border: `1px solid ${error ? red.A700 : blue.A700}`,
          },
          '&.Mui-disabled': {
            color: grey.A400,
            background: grey.A100,
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: grey.A200,
          },
        },
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: error ? red.A700 : grey.A200,
        },
        ...sx,
      }}
      {...props}
    />
  ),
);

CustomTextField.displayName = 'TextField';
export { CustomTextField };
