import { FC } from 'react';

import { IFile } from '../types/types';
import {
  DataGrid,
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { getTableColDef } from '../helpers/utils';

interface FileExplorerTableProps {
  items: IFile | IFile[];
  loading?: boolean;
  search?: string;
  columnVisibilityModel?: GridColumnVisibilityModel;
  onFolderClick?: (file: IFile) => void;
  fetchMore?: (params: GridPaginationModel) => void;
  paginationModel: GridPaginationModel;
  rowCount: number;
}

export const FileExplorerTable: FC<FileExplorerTableProps> = ({
  items,
  columnVisibilityModel,
  onFolderClick,
  fetchMore,
  paginationModel,
  rowCount,
  loading,
}) => {
  const handlePaginationChange = (paginationModel: GridPaginationModel) => {
    if (fetchMore) fetchMore(paginationModel);
  };
  const rows = Array.isArray(items) ? items : [items];
  return (
    <DataGrid
      disableColumnMenu
      columnHeaderHeight={34}
      columnVisibilityModel={columnVisibilityModel}
      rowHeight={48}
      disableRowSelectionOnClick
      loading={loading}
      onRowClick={({ row }: GridRowParams<IFile>) =>
        row.type === 'directory' && onFolderClick && onFolderClick(row)
      }
      autosizeOptions={{
        includeOutliers: true,
      }}
      columns={getTableColDef()}
      rows={rows}
      rowCount={rowCount}
      pageSizeOptions={[10, 25, 50]}
      paginationModel={{
        page: paginationModel.page - 1,
        pageSize: paginationModel.pageSize,
      }}
      onPaginationModelChange={handlePaginationChange}
      paginationMode="server"
      sx={{
        '& .MuiDataGrid-columnSeparator': {
          display: 'none',
        },
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          '&:focus': {
            outline: 'none',
          },
        },
      }}
    />
  );
};
