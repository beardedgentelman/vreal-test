import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useState, useCallback } from 'react';
import { AxiosProgressEvent } from 'axios';
import { GridSortModel, GridPaginationModel } from '@mui/x-data-grid';
import apiClient from '../api/axios';
import { IFile } from '../types/types';
import { UserAndPermissionData } from '../components/modals/ShareFileModal';

const DEFAULT_PAGE_SIZE = 50;

interface UploadFilePayload {
  file: File;
  dirPath: string;
  isPublic: boolean;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

interface CreateDirectoryPayload {
  name: string;
  dirPath: string;
  type: string;
  isPublic: boolean;
}

interface UpdateFilePayload {
  id: string;
  name?: string;
  dirPath?: string;
  isPublic?: boolean;
}

interface GetDirListParams {
  search?: string;
  dir_path?: string;
  page: number;
  pageSize: number;
}

interface GetDirListResponse {
  items: IFile[];
  total: number;
}

interface DeleteFilePayload {
  id: string;
}

export const useFiles = ({
  dirPath,
  link,
}: {
  dirPath?: string;
  link?: string;
}) => {
  const [search, setSearch] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: 'startedAt',
      sort: 'desc',
    },
  ]);
  const accessToken = localStorage.getItem('accessToken');

  const fetchFiles = async (): Promise<GetDirListResponse> => {
    const response = await apiClient.get<GetDirListResponse>(
      `/file/get-dir-list`,
      {
        params: {
          search: search || undefined,
          dir_path: dirPath || '/',
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          link: link || undefined,
        },
      },
    );
    return response.data;
  };

  const fetchFilesByLink = async (): Promise<GetDirListResponse> => {
    const response = await apiClient.get<GetDirListResponse>('file/shared', {
      params: {
        link: link || undefined,
        search: search || undefined,
        dir_path: dirPath || undefined,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, refetch } = useQuery(
    [
      'files',
      dirPath,
      search,
      paginationModel.page,
      paginationModel.pageSize,
      link,
    ],
    link ? (accessToken ? fetchFiles : fetchFilesByLink) : fetchFiles,
    {
      keepPreviousData: true,
      staleTime: 5000,
      enabled: true,
    },
  );

  const fetchPermissionsList = async () => {
    const response = await apiClient.get(`/file/permissions-list`);
    return response.data;
  };

  const {
    data: permissionsList,
    isLoading: isLoadingPermissionsList,
    refetch: refetchPermissionsList,
  } = useQuery(['permissions', link], fetchPermissionsList, {
    staleTime: 5000,
    enabled: !link,
  });

  const getUsersWithPermissions = async (fileId: string) => {
    const response = await apiClient.get(`/file/shared-users/${fileId}`);
    return response.data;
  };

  const fetchUsersWithPermissions = (fileId: string | null) =>
    useQuery(
      ['sharedUsers', fileId],
      () => (fileId ? getUsersWithPermissions(fileId) : Promise.resolve([])),
      {
        staleTime: 5000,
        enabled: !!fileId,
      },
    );

  const uploadFile = useMutation({
    mutationFn: async ({
      file,
      dirPath,
      isPublic,
      onUploadProgress,
    }: UploadFilePayload) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dirPath', dirPath || '/');
      formData.append('isPublic', String(isPublic));

      const response = await apiClient.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });

      return response.data;
    },
    onSuccess: () => refetch(),
  });

  const createDirectory = useMutation({
    mutationFn: async (payload: CreateDirectoryPayload) => {
      const response = await apiClient.post(`/file/create-directory`, payload);
      return response.data;
    },
    onSuccess: () => refetch(),
  });

  const updateFile = useMutation({
    mutationFn: async (payload: UpdateFilePayload) => {
      const response = await apiClient.put('/file/update', payload);
      return response.data;
    },
    onSuccess: () => refetch(),
  });

  const deleteFile = useMutation({
    mutationFn: async (payload: DeleteFilePayload) => {
      const response = await apiClient.delete(`/file/delete`, {
        data: payload,
      });
      return response.data;
    },
    onSuccess: () => refetch(),
  });

  const useShareFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({
        fileId,
        isPublic,
        usersAndPermissions,
      }: UserAndPermissionData) => {
        const response = await apiClient.post('/file/share', {
          fileId,
          isPublic,
          usersAndPermissions,
        });
        return response.data;
      },
      onSuccess: () => queryClient.invalidateQueries(['sharedUsers']),
    });
  };

  const useUpdateSharedFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({
        fileId,
        isPublic,
        usersAndPermissions,
      }: UserAndPermissionData) => {
        const response = await apiClient.post('/file/update-share', {
          fileId,
          isPublic,
          usersAndPermissions,
        });
        return response.data;
      },
      onSuccess: () => queryClient.invalidateQueries(['sharedUsers']),
    });
  };

  const generateShareLink = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiClient.post('/file/generate-share-link', {
        id: fileId,
      });
      return response.data.link;
    },
    onSuccess: () => refetch(),
  });

  const revokeShareLink = useMutation({
    mutationFn: async (fileId: string) => {
      await apiClient.post('/file/revoke-share-link', { id: fileId });
    },
  });

  const handlePaginationChange = useCallback(
    (newPaginationModel: GridPaginationModel) => {
      setPaginationModel({
        page: newPaginationModel.page,
        pageSize: newPaginationModel.pageSize,
      });
    },
    [],
  );

  const loadNextPage = useCallback(() => {
    if ((data?.items.length || 0) < (data?.total || 0)) {
      setPaginationModel((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  }, [data?.items?.length, data?.total]);

  return {
    state: {
      files: data?.items || [],
      total: data?.total || 0,
      search,
      loading: isLoading,
      sortModel,
      paginationModel,
      permissionsList,
      loadingPermissions: isLoadingPermissionsList,
    },
    actions: {
      setSearch,
      setSortModel,
      setPaginationModel: handlePaginationChange,
      loadNextPage,
      refetch,
      refetchPermissionsList,
    },
    mutations: {
      uploadFile,
      createDirectory,
      updateFile,
      deleteFile,
      useShareFile,
      useUpdateSharedFile,
      generateShareLink,
      revokeShareLink,
    },
    queries: {
      fetchUsersWithPermissions,
    },
  };
};
