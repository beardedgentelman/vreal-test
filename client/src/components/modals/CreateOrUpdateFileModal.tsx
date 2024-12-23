import React, { FC } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface CreateOrUpdateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  onFolderNameChange: (newName: string) => void;
  onSave: () => void;
  isEdit: boolean;
  isCreating: boolean;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
}

export const CreateOrUpdateFileModal: FC<CreateOrUpdateFileModalProps> = ({
  isOpen,
  onClose,
  folderName,
  onFolderNameChange,
  isEdit,
  onSave,
  isCreating,
  isPublic,
  onPublicChange,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="create-folder-modal"
      aria-describedby="modal-to-create-new-folder"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography id="create-folder-modal" variant="h6" component="h2" mb={2}>
          {!isEdit ? 'Create New Folder' : 'Edit'}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
            />
          }
          label="Is Public"
        />
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          disabled={isCreating}
        />
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={!folderName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};
