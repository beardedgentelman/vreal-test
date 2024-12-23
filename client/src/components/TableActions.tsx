import React, { FC, useState } from 'react';
import { IconButton } from '@mui/material';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { ContextMenu } from './ContextMenu';
import { useTableActionsItems } from '../hooks/useTableActions';
import { IFile } from '../types/types';
import { ConfirmationModal } from './modals/ConfirmModal';
import { CreateOrUpdateFileModal } from './modals/CreateOrUpdateFileModal';
import { ShareFileModal } from './modals/ShareFileModal';
import { useFiles } from '../hooks/useFiles';
import { useSearchParams } from 'react-router-dom';

interface TableActionsProps {
  file: IFile;
}

export const TableActions: FC<TableActionsProps> = ({ file }) => {
  const [searchParams] = useSearchParams();
  const dirPath = searchParams.get('path');
  const link = searchParams.get('link');
  const permissions = searchParams.get('permissions');

  const { mutations, actions: fileActions } = useFiles({
    dirPath: dirPath || undefined,
    link: link || undefined,
  });

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
    null,
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState(file.name);
  const [fileExtension, setFileExtension] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(file.isPublic);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  const handleOpenEditModal = () => {
    if (file.type !== 'directory') {
      const lastDotIndex = file.name.lastIndexOf('.');
      if (lastDotIndex > 0) {
        setNewFileName(file.name.substring(0, lastDotIndex));
        setFileExtension(file.name.substring(lastDotIndex));
      } else {
        setNewFileName(file.name);
        setFileExtension(null);
      }
    } else {
      setNewFileName(file.name);
      setFileExtension(null);
    }
    setIsPublic(file.isPublic);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = () => {
    const trimmedFileName = newFileName.trim();
    if (!trimmedFileName) {
      return;
    }

    let finalFileName = trimmedFileName;
    if (file.type === 'file' && fileExtension) {
      finalFileName += fileExtension;
    }

    if (finalFileName !== file.name || isPublic !== file.isPublic) {
      mutations.updateFile.mutate(
        {
          id: file.id,
          name: finalFileName,
          isPublic,
        },
        {
          onSuccess: () => {
            setIsEditModalOpen(false);
          },
        },
      );
    } else {
      setIsEditModalOpen(false);
    }
  };

  const openShareModal = (link: string | null) => {
    setShareableLink(link);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setShareableLink(null);
  };

  const handleAction = (handler: () => void) => {
    setActionToConfirm(() => handler);
    setIsConfirmOpen(true);
  };

  const handleDelete = () => {
    mutations.deleteFile.mutate(
      { id: file.id },
      {
        onSuccess: () => {
          setIsConfirmOpen(false);
        },
      },
    );
  };

  const tableActions = useTableActionsItems({
    file,
    openEditModal: handleOpenEditModal,
    openShareModal: (link?: string | null) => {
      if (link !== undefined) {
        openShareModal(link);
      }
      openShareModal(null);
    },
    revokeShareLink: () => {
      mutations.revokeShareLink.mutate(file.id, {
        onSuccess: () => {
          setShareableLink(null);
          fileActions.refetch();
        },
      });
    },
  });

  if (!tableActions.length) return null;

  return (
    <>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{ padding: 0 }}
        size="small"
      >
        <MoreHorizOutlinedIcon sx={{ color: '#000000' }} />
      </IconButton>
      <ContextMenu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        items={tableActions.map((action) => ({
          ...action,
          handler: () => {
            if (action.label === 'Delete') {
              handleAction(() => handleDelete());
            } else {
              action.handler();
            }
          },
        }))}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (actionToConfirm) actionToConfirm();
        }}
        message={`Are you sure you want to delete ${file.name}?`}
      />
      <CreateOrUpdateFileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        folderName={newFileName}
        onFolderNameChange={setNewFileName}
        onSave={handleSaveEdit}
        isEdit={true}
        isCreating={mutations.updateFile.isLoading}
        isPublic={isPublic}
        onPublicChange={setIsPublic}
      />
      {isShareModalOpen && (
        <ShareFileModal
          isOpen={isShareModalOpen}
          onClose={closeShareModal}
          fileId={file.id}
        />
      )}
    </>
  );
};
