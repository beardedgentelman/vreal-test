import { IFile } from '../types/types';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFiles } from './useFiles';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from './useUsers';

interface useTableActionsItemsProps {
  file: IFile;
  openEditModal: () => void;
  openShareModal: (link?: string | null) => void;
}

export const useTableActionsItems = ({
  file,
  openEditModal,
  openShareModal,
}: useTableActionsItemsProps & { revokeShareLink: () => void }) => {
  const user = useUsers();
  const [searchParams] = useSearchParams();
  const dirPath = searchParams.get('path');
  const link = searchParams.get('link');
  const permissions = searchParams.get('permissions');

  const isOwner = file.ownerId === user.data.id;

  const { mutations } = useFiles({
    dirPath: dirPath || undefined,
    link: link || undefined,
  });

  return [
    {
      label: 'Copy',
      icon: ContentCopyOutlinedIcon,
      hidden: false,
      handler: () => {
        console.log('copy');
      },
    },
    {
      label: 'Share',
      icon: LinkOutlinedIcon,
      hidden: !isOwner,
      handler: () => {
        openShareModal();
      },
    },
    {
      label: 'Edit',
      icon: EditOutlinedIcon,
      hidden: permissions ? permissions !== 'WRITE' : false,
      handler: () => {
        openEditModal();
      },
    },
    {
      label: 'Delete',
      icon: DeleteOutlinedIcon,
      hidden: permissions ? permissions !== 'DELETE' : false,
      handler: () => {
        mutations.deleteFile.mutate(
          { id: file.id },
          {
            onSuccess: () => {
              alert(`${file.name} has been deleted.`);
            },
          },
        );
      },
    },
  ];
};
