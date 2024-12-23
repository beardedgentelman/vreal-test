import { useEffect } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../constants';

export const GoogleSign = () => {
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('accessToken');
  const refreshToken = urlParams.get('refreshToken');

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    if (accessToken) {
      navigate('/panel');
    }
  }, [accessToken]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <Box
      maxWidth={500}
      width={'100%'}
      sx={{ border: '2px solid #4479cf', borderRadius: 4 }}
    >
      <Box width={'100%'} sx={{ borderBottom: '1px solid #4479cf' }}>
        <Typography align={'center'}>VrealSoft Test Task</Typography>
      </Box>
      <Stack sx={{ p: 6 }} justifyContent={'center'} alignItems={'center'}>
        <Typography mb={6} align={'center'}>
          Sign In/Sign Up
        </Typography>

        <Button
          sx={{ maxWidth: 250, mb: 2 }}
          variant="outlined"
          onClick={handleGoogleLogin}
        >
          Sign up with Google
        </Button>
        <Link href="#" underline="hover">
          Need Help?
        </Link>
      </Stack>
    </Box>
  );
};
