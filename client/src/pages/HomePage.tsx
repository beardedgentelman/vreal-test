import { Stack } from '@mui/material';
import { GoogleSign } from '../components/GoogleSign';

export const LoginPage = () => {
  return (
    <Stack
      width={'100vw'}
      height={'100vh'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <GoogleSign />
    </Stack>
  );
};
