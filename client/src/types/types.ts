import { Dayjs } from 'dayjs';
import { SyntheticEvent } from 'react';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

export interface IFile {
  id: string;
  createdAt: Dayjs;
  fileExtension?: string | null;
  dirPath: string;
  updatedAt: string | Dayjs;
  name: string;
  ownerId: number;
  size?: number | null;
  type: 'unknown' | 'directory' | 'file';
  isPublic: boolean;
  shareableLink: string;
}

export enum FilesTableColsEnum {
  CHEVRON_ICON = 'chevronIcon',
  FILE_ICON = 'fileIcon',
  NAME = 'name',
  FORMAT = 'format',
  UPDATED_AT = 'updatedAt',
  ACTIONS = 'actions',
  PATH = 'path',
}

export interface ContextMenuItem {
  label: string;
  icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & { muiName: string };
  handler: (
    e: SyntheticEvent<HTMLDivElement, MouseEvent>,
  ) => Promise<void> | void;
  hidden?: boolean;
}
