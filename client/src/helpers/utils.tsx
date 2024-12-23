import { GridColDef } from '@mui/x-data-grid';
import { Typography } from '@mui/material';
import { FilesTableColsEnum, IFile } from '../types/types';
import dayjs, { Dayjs } from 'dayjs';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import { TableActions } from '../components/TableActions';

type DateArg = Dayjs | Date | string | undefined | null;

const getInstance = (date: DateArg) => {
  if (!date) {
    return null;
  }

  const dateInstance = dayjs(date);

  if (!dateInstance.isValid()) {
    return null;
  }

  return dateInstance;
};

function formatDate(date: DateArg, formatTemplate: string) {
  const dateInstance = getInstance(date);

  if (!dateInstance) {
    return '';
  }

  return dateInstance.format(formatTemplate);
}

const dateTimeAndYearToString = (date: DateArg): string =>
  formatDate(date, 'MMM DD YYYY, HH:mm');

export const getTableColDef = (): GridColDef<IFile>[] => [
  {
    field: FilesTableColsEnum.CHEVRON_ICON,
    headerName: '',
    sortable: false,
    minWidth: 32,
    width: 32,
    filterable: false,
    align: 'center',
    renderCell: ({ row }) =>
      row.type === 'directory' ? (
        <ChevronRightOutlinedIcon sx={{ fontSize: '16px' }} />
      ) : null,
  },
  {
    field: FilesTableColsEnum.FILE_ICON,
    headerName: '',
    sortable: false,
    minWidth: 32,
    width: 32,
    filterable: false,
    align: 'center',
    renderCell: ({ row }) =>
      row.type !== 'directory' ? (
        <InsertDriveFileOutlinedIcon />
      ) : (
        <FolderOpenOutlinedIcon />
      ),
  },
  {
    field: FilesTableColsEnum.NAME,
    headerName: 'Name',
    sortable: false,
    filterable: false,
    minWidth: 110,
    flex: 1,
    renderCell: ({ row }) => {
      return <Typography>{row.name}</Typography>;
    },
  },
  {
    field: FilesTableColsEnum.PATH,
    headerName: 'Path',
    sortable: false,
    filterable: false,
    minWidth: 110,
    flex: 1,
    renderCell: ({ row }) => <Typography>{row.dirPath}</Typography>,
  },
  {
    field: FilesTableColsEnum.FORMAT,
    headerName: 'Format',
    sortable: false,
    filterable: false,
    minWidth: 72,
    flex: 1,
    renderCell: ({ row }) => (
      <Typography
        textTransform={row.type === 'directory' ? 'none' : 'uppercase'}
      >
        {row.type === 'directory' ? 'folder' : row.fileExtension || '-'}
      </Typography>
    ),
  },
  {
    field: FilesTableColsEnum.UPDATED_AT,
    headerName: 'Last modified',
    sortable: false,
    filterable: false,
    width: 195,
    flex: 1,
    renderCell: ({ row }) => (
      <Typography>{dateTimeAndYearToString(row.updatedAt)}</Typography>
    ),
  },
  {
    field: FilesTableColsEnum.ACTIONS,
    headerName: '',
    sortable: false,
    filterable: false,
    width: 40,
    minWidth: 40,
    renderCell: ({ row }) => <TableActions file={row} />,
  },
];
