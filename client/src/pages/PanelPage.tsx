import Header from '../components/Header';
import { useSearchParams } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import { FileExplorerTable } from '../components/FileExplorerTable';
import { useFiles } from '../hooks/useFiles';
import { FilesTableColsEnum } from '../types/types';
import { PathBreadcrumbs } from '../components/PathBreadcrumbs';
import { SearchField } from '../components/SearchField';
import { useEffect, useState } from 'react';
import { UploadFileModal } from '../components/modals/UploadFileModal';
import { CreateOrUpdateFileModal } from '../components/modals/CreateOrUpdateFileModal';

export const PanelPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dirPath = searchParams.get('path');
  const isPublicParam = searchParams.get('isPublic');
  const link = searchParams.get('link');
  const permissions = searchParams.get('permissions');
  const { state, actions, mutations } = useFiles({
    dirPath: dirPath || undefined,
    link: link || undefined,
  });

  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      mutations.createDirectory.mutate(
        {
          name: newFolderName,
          dirPath: dirPath || '/',
          type: 'directory',
          isPublic,
        },
        {
          onSuccess: () => {
            handleCloseDirectoryModal();
            actions.refetch();
          },
        },
      );
    }
  };

  const handleCloseDirectoryModal = () => {
    setIsDirectoryModalOpen(false);
    setNewFolderName('');
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    actions.refetch();
  };

  useEffect(() => {
    if (isPublicParam !== null) {
      setIsPublic(isPublicParam === 'true');
    } else {
      setIsPublic(false);
    }
  }, [isPublicParam]);

  return (
    <>
      <Header />
      <Stack width={'100%'} height={'100%'}>
        <PathBreadcrumbs />
        <Stack
          width="100%"
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          gap={1}
          mt={1}
          mb={1}
          flexWrap={'wrap'}
        >
          <SearchField
            sx={{ width: '244px', flex: 'none' }}
            search={state.search}
            onSearchChange={actions.setSearch}
          />
          {!permissions || permissions === '' || permissions === 'WRITE' ? (
            <Stack justifyContent={'flex-end'} flexDirection={'row'}>
              <Button onClick={handleOpenUploadModal}>Upload file</Button>
              <Button
                onClick={() => setIsDirectoryModalOpen(true)}
                disabled={mutations.createDirectory.isLoading}
              >
                {mutations.createDirectory.isLoading
                  ? 'Creating...'
                  : 'Create folder'}
              </Button>
            </Stack>
          ) : null}
        </Stack>
        <FileExplorerTable
          loading={state.loading}
          columnVisibilityModel={{
            [FilesTableColsEnum.PATH]: true,
          }}
          onFolderClick={(file) => {
            const params: Record<string, string> = {
              path:
                file.dirPath !== '/'
                  ? `${file.dirPath}/${file.name}`
                  : `/${file.name}`,
              isPublic: file.isPublic ? 'true' : 'false',
            };

            if (link) {
              params.link = link;
            }
            if (permissions) {
              params.permissions = permissions;
            }

            setSearchParams(params);
          }}
          search={state.search}
          items={state.files}
          fetchMore={({ page, pageSize }) => {
            actions.setPaginationModel({ page: page + 1, pageSize });
          }}
          rowCount={state.total}
          paginationModel={state.paginationModel}
        />
      </Stack>

      {isUploadModalOpen && (
        <UploadFileModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          dirPath={dirPath || '/'}
          onUploadSuccess={handleUploadSuccess}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
        />
      )}

      <CreateOrUpdateFileModal
        isOpen={isDirectoryModalOpen}
        onClose={handleCloseDirectoryModal}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        onSave={handleCreateFolder}
        isEdit={false}
        isCreating={mutations.createDirectory.isLoading}
        isPublic={isPublic}
        onPublicChange={setIsPublic}
      />
    </>
  );
};
