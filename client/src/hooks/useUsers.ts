import { useQuery } from 'react-query';
import apiClient from '../api/axios';
import { IUser } from '../types/types';

export const useUsers = () => {
  return useQuery(
    ['me'],
    async () => {
      const response = await apiClient.get(`/users/me`);
      return response.data;
    },
    {
      retry: 1,
      enabled: !!localStorage.getItem('accessToken'),
    },
  );
};

export const useUsersList = () => {
  return useQuery(
    ['users'],
    async () => {
      const response = await apiClient.get(`/users`);
      return response.data;
    },
    {
      retry: 1,
      enabled: !!localStorage.getItem('accessToken'),
    },
  );
};
