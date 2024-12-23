import React, { FC, useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  IconButton,
  Stack,
  Alert,
} from '@mui/material';
import CopyIcon from '@mui/icons-material/ContentCopy';

import { useUsersList } from '../../hooks/useUsers';
import { useFiles } from '../../hooks/useFiles';
import { useSearchParams } from 'react-router-dom';
import { CLIENT_URL } from '../../constants';
import { IUser } from '../../types/types';

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
}

export interface UserAndPermissionData {
  fileId: string;
  isPublic: boolean;
  usersAndPermissions: Array<{
    user: string;
    permission: string;
  }>;
}

export const ShareFileModal: FC<ShareFileModalProps> = ({
  isOpen,
  onClose,
  fileId,
}) => {
  const [searchParams] = useSearchParams();
  const dirPath = searchParams.get('path');
  const link = searchParams.get('link');
  const { state, mutations, actions, queries } = useFiles({
    dirPath: dirPath || undefined,
    link: link || undefined,
  });
  const { permissionsList: permissions = [], loadingPermissions } = state;
  const { data: users = [], isLoading: loadingUsers } = useUsersList();
  const { data: sharedUsers = [], isLoading: loadingSharedUsers } =
    queries.fetchUsersWithPermissions(fileId);
  const { mutate: shareFile } = mutations.useShareFile();
  const { mutate: updateSharedFile } = mutations.useUpdateSharedFile();
  const [usersAndPermissions, setUsersAndPermissions] = useState<
    Array<{ user: string; permission: string }>
  >([]);

  useEffect(() => {
    if (sharedUsers && sharedUsers.length > 0) {
      setUsersAndPermissions(
        sharedUsers.map((sharedUser: any) => {
          const email = sharedUser?.user.email || '';
          const permission = sharedUser?.permission || '';
          return {
            user: email,
            permission: permission,
          };
        }),
      );
    }
  }, [sharedUsers]);

  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const currentFile = state.files.find((file) => file.id === fileId);
  const isPublic = currentFile?.isPublic || false;

  useEffect(() => {
    if (currentFile?.shareableLink) {
      setShareableLink(
        `${CLIENT_URL}/panel?link=${currentFile.shareableLink}&permissions=READ`,
      );
    }
  }, [currentFile]);

  const handleCopy = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      alert('Link copied to clipboard!');
    }
  };

  const togglePublicAccess = () => {
    const newIsPublic = !isPublic;

    mutations.updateFile.mutate(
      { id: fileId, isPublic: newIsPublic },
      {
        onSuccess: () => {
          if (newIsPublic) {
            mutations.generateShareLink.mutate(fileId, {
              onSuccess: (link) => {
                setShareableLink(link);
                setShareError(null);
              },
              onError: (error: any) => {
                setShareError(
                  error.response?.data?.message || 'Failed to generate link.',
                );
                setShareableLink(null);
              },
            });
          } else {
            mutations.revokeShareLink.mutate(fileId, {
              onSuccess: () => {
                setShareableLink(null);
                setShareError(null);
                actions.refetch();
              },
              onError: () => {
                setShareError('Failed to revoke the shareable link.');
              },
            });
          }
        },
        onError: () => {
          setShareError('Failed to update public access. Please try again.');
        },
      },
    );
  };

  const handleAddUserRow = () => {
    setUsersAndPermissions([
      ...usersAndPermissions,
      { user: '', permission: '' },
    ]);
    setShareError(null);
  };

  const handleRemoveUserRow = (index: number) => {
    setUsersAndPermissions(usersAndPermissions.filter((_, i) => i !== index));
    setShareError(null);
  };

  const handleUserPermissionChange = (
    index: number,
    field: 'user' | 'permission',
    value: string,
  ) => {
    const updated = [...usersAndPermissions];
    updated[index][field] = value;
    setUsersAndPermissions(updated);
    setShareError(null);
  };

  const handleShare = () => {
    const invalidRow = usersAndPermissions.find(
      (entry) => !entry.user || !entry.permission,
    );

    if (invalidRow) {
      setShareError('Please fill all user and permission fields.');
      return;
    }

    if (!sharedUsers || sharedUsers.length === 0) {
      shareFile(
        { fileId, isPublic, usersAndPermissions },
        {
          onSuccess: () => {
            setShareError(null);
            alert('File shared successfully!');
            onClose();
          },
          onError: () => {
            setShareError('An error occurred while sharing the file.');
          },
        },
      );
      return;
    }

    const hasUsersChanged =
      sharedUsers?.length !== usersAndPermissions.length ||
      sharedUsers.some(
        (sharedUser: { user: IUser; permission: string }, index: number) =>
          sharedUser.user.email !== usersAndPermissions[index].user ||
          sharedUser.permission !== usersAndPermissions[index].permission,
      );

    if (hasUsersChanged) {
      updateSharedFile(
        { fileId, isPublic, usersAndPermissions },
        {
          onSuccess: () => {
            setShareError(null);
            alert('File sharing settings updated successfully!');
            onClose();
          },
          onError: () => {
            setShareError(
              'An error occurred while updating the file sharing settings.',
            );
          },
        },
      );
    } else {
      setShareError('No changes were made to the sharing settings.');
    }
  };

  const handleClose = () => {
    setShareError(null);
    onClose();
  };

  if (loadingPermissions || loadingUsers || loadingSharedUsers) {
    return (
      <Modal open={isOpen} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Share File
          </Typography>
          <Typography variant="body1">Loading...</Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          maxWidth: '90%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Share File
        </Typography>
        {shareError && (
          <Alert severity="error" sx={{ my: 2 }}>
            {shareError}
          </Alert>
        )}

        <Box mt={2} mb={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            General Access
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="textSecondary">
              {isPublic
                ? 'Anyone with the link can view'
                : 'Restricted - Only added users can access'}
            </Typography>
            <Button
              onClick={togglePublicAccess}
              variant="contained"
              color={isPublic ? 'secondary' : 'primary'}
            >
              {isPublic ? 'Disable Link' : 'Enable Link'}
            </Button>
          </Box>
          {isPublic && (
            <Box mt={2} display="flex" alignItems="center">
              <TextField
                fullWidth
                value={shareableLink}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <IconButton onClick={handleCopy}>
                <CopyIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        <Divider />

        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Share with People
        </Typography>
        <Stack gap={1} mt={3}>
          {usersAndPermissions.length > 0 &&
            usersAndPermissions.map((entry, index) => (
              <Stack
                flexDirection="row"
                gap={1}
                key={index}
                alignItems="center"
              >
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id={`user-select-label-${index}`}>
                    Select User
                  </InputLabel>
                  <Select
                    labelId={`user-select-label-${index}`}
                    id={`user-select-${index}`}
                    label="Select User"
                    value={entry.user}
                    onChange={(e) =>
                      handleUserPermissionChange(index, 'user', e.target.value)
                    }
                  >
                    {users.map((user: any) => (
                      <MenuItem key={user.id} value={user.email}>
                        {user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id={`permission-select-label-${index}`}>
                    Select Permission
                  </InputLabel>
                  <Select
                    labelId={`permission-select-label-${index}`}
                    id={`permission-select-${index}`}
                    label="Select Permission"
                    value={entry.permission}
                    onChange={(e) =>
                      handleUserPermissionChange(
                        index,
                        'permission',
                        e.target.value,
                      )
                    }
                  >
                    {permissions.map((permission: any) => (
                      <MenuItem key={permission} value={permission}>
                        {permission}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  onClick={() => handleRemoveUserRow(index)}
                  color="error"
                  variant="outlined"
                  sx={{ height: '100%', minHeight: '56px' }}
                >
                  Remove
                </Button>
              </Stack>
            ))}
          <Button
            onClick={handleAddUserRow}
            sx={{ mt: 2 }}
            color="primary"
            variant="contained"
            fullWidth
          >
            Add User
          </Button>
        </Stack>

        <Divider />
        <Box mt={3} textAlign="right">
          <Stack flexDirection="row" justifyContent="flex-end" gap={1}>
            <Button onClick={handleShare} color="primary" variant="contained">
              Save
            </Button>
            <Button onClick={handleClose} color="secondary">
              Close
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
