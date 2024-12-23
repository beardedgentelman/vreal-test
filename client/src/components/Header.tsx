import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMutation } from 'react-query';
import { UserCard } from './UserCard';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../hooks/useUsers';
import apiClient from '../api/axios';

interface LogoutResponse {
  success: boolean;
  message: string;
}

const logoutUser = async (userId: number): Promise<LogoutResponse> => {
  const response = await apiClient.post(`/auth/logout`, { userId });
  return response.data;
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
}));

const Header: React.FC = () => {
  const { data: user, isLoading, isError } = useUsers();
  const navigate = useNavigate();

  const logoutMutation = useMutation<LogoutResponse, Error, number>(
    (userId) => logoutUser(userId),
    {
      onSuccess: (data) => {
        localStorage.clear();
        navigate('/');
      },
      onError: (error: Error) => {
        console.error('Logout failed:', error.message);
      },
    },
  );

  const handleLogout = () => {
    if (user?.id) {
      logoutMutation.mutate(user.id);
    } else {
      console.error('User ID is missing');
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (isError || !user) {
    localStorage.removeItem('accessToken');
  }

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link underline="hover" color={'#ffffff'} href={'/panel'}>
            LOGO.
          </Link>
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          {!isError && user ? (
            <>
              <UserCard user={user} />
              <Button
                sx={{
                  textTransform: 'capitalize',
                }}
                variant="outlined"
                color="inherit"
                onClick={handleLogout}
                disabled={logoutMutation.isLoading}
              >
                {logoutMutation.isLoading ? 'Logging out...' : 'Logout'}
              </Button>{' '}
            </>
          ) : (
            <Link underline="hover" color={'#ffffff'} href={'/'}>
              Login
            </Link>
          )}
        </Stack>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
