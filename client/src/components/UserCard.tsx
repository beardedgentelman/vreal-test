import { Avatar, Stack, Typography } from '@mui/material';
import { IUser } from '../types/types';

export const UserCard = (props: { user: IUser }) => {
  const { user } = props;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
    >
      <Avatar
        alt={`${user.firstName} ${user.lastName}`}
        src={`${user.picture}`}
      />
      <Typography align={'center'}>
        {user.firstName} {user.lastName}
      </Typography>
    </Stack>
  );
};
