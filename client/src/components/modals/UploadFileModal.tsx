import React, { FC, useState } from 'react';
import {
  Box,
  Button,
  Modal,
  Stack,
  Typography,
  LinearProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { AxiosProgressEvent } from 'axios';
import { useFiles } from '../../hooks/useFiles';
import { useSearchParams } from 'react-router-dom';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  dirPath: string;
  onUploadSuccess: () => void;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
}

export const UploadFileModal: FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  dirPath,
  onUploadSuccess,
  isPublic,
  onPublicChange,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchParams] = useSearchParams();
  const link = searchParams.get('link');

  const { mutations } = useFiles({ dirPath: dirPath, link: link || undefined });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      mutations.uploadFile.mutate(
        {
          file: selectedFile,
          dirPath,
          isPublic,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1),
            );
            setUploadProgress(progress);
          },
        },
        {
          onSuccess: () => {
            setSelectedFile(null);
            setUploadProgress(0);
            onUploadSuccess();
            onClose();
          },
        },
      );
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="upload-file-modal">
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
        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
            />
          }
          label="Is Public"
        />
        <Typography id="upload-file-modal" variant="h6" component="h2" mb={2}>
          Upload File
        </Typography>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={mutations.uploadFile.isLoading}
          style={{
            marginBottom: '16px',
          }}
        />
        {mutations.uploadFile.isLoading && (
          <LinearProgress variant="determinate" value={uploadProgress} />
        )}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={mutations.uploadFile.isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || mutations.uploadFile.isLoading}
          >
            {mutations.uploadFile.isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};
