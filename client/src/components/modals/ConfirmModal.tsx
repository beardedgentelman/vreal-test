import React, { FC } from 'react';
import { Box, Button, Modal, Stack, Typography } from '@mui/material';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
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
          p: 3,
          borderRadius: 1,
        }}
      >
        <Typography
          id="confirmation-modal-title"
          variant="h6"
          sx={{ mb: 2, textAlign: 'center' }}
        >
          Confirmation
        </Typography>
        <Typography id="confirmation-modal-description" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Stack direction="row" justifyContent="space-between">
          <Button onClick={onClose} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="contained" color="error">
            Confirm
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};
