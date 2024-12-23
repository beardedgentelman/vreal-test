import {
  debounce,
  IconButton,
  InputAdornment,
  SxProps,
  TextField,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { blue } from '@mui/material/colors';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { CustomTextField } from './TextField';

interface SearchFieldProps {
  search: string | null;
  sx?: SxProps;
  placeHolder?: string;
  onSearchChange: (value: string) => void;
  isFocused?: boolean;
  disabled?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  search,
  onSearchChange,
  sx,
  placeHolder = 'Search',
  isFocused = false,
  disabled,
}) => {
  const [searchValue, setSearchValue] = useState<string>(search || '');
  const inputRef = React.useRef<HTMLDivElement>(null);

  const onCloseHandle = () => {
    setSearchValue('');
    onSearchChange('');
    inputRef.current?.querySelector('input')?.focus();
  };

  const debouncedChangeHandler = useCallback(debounce(onSearchChange, 500), [
    onSearchChange,
  ]);

  const handleChangeSearchValue = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const target = event.target;
    setSearchValue(target.value);
    debouncedChangeHandler(target.value);
  };

  React.useEffect(() => {
    isFocused && inputRef.current?.querySelector('input')?.focus();
  }, []);

  React.useEffect(() => {
    setSearchValue(search as string);
  }, [search]);

  return (
    <CustomTextField
      data-testid="search-field"
      ref={inputRef}
      placeholder={placeHolder}
      value={searchValue}
      disabled={disabled}
      onChange={handleChangeSearchValue}
      className={searchValue ? 'filled' : ''}
      sx={{
        flex: 1,
        width: 'auto',
        '& .Mui-focused, &.filled:not(:hover)': {
          '.MuiSvgIcon-root': {
            color: blue.A200,
          },
          '.MuiInputBase-input': {
            color: blue.A200,
          },
        },
        input: {
          padding: 0,
        },
        ...sx,
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon
                data-testid="search-icon"
                sx={{
                  paddingLeft: '2px',
                  fontSize: '19px',
                  color: '#000000',
                  strokeWidth: 5,
                }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {searchValue.length ? (
                <IconButton size="small" onClick={onCloseHandle}>
                  <CloseOutlinedIcon data-testid="close" fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
