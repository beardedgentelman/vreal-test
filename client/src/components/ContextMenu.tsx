import {
  Box,
  ClickAwayListener,
  ListItemButton,
  ListItemIcon,
  Popper,
  PopperProps,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { FC } from 'react';
import { ContextMenuItem } from '../types/types';
import { blue } from '@mui/material/colors';

const StyledPopper = styled(Popper)(() => ({
  zIndex: 999,
  boxSizing: 'border-box',
  fontSize: '13px',
  padding: '16px',
  borderRadius: '10px',
  boxShadow: ' 0px 4px 8px -2px #0000001a',
  minWidth: '208px',
  background: `#ffffff`,
}));

interface ContextMenuProps extends PopperProps {
  items?: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: FC<ContextMenuProps> = ({
  open,
  id,
  items,
  sx,
  children,
  placement = 'bottom-start',
  onClose,
  ...rest
}) => {
  const popoverId = open ? id : undefined;

  return (
    <>
      <StyledPopper
        {...rest}
        placement={placement}
        sx={sx}
        open={open}
        id={popoverId}
      >
        <ClickAwayListener onClickAway={onClose}>
          <Box>
            <>
              {items && (
                <Stack gap={2}>
                  {items.map(({ ...item }: ContextMenuItem) => {
                    const IconComponent = item?.icon || undefined;

                    if (item.hidden) return null;
                    return (
                      <Box key={item.label}>
                        <ListItemButton
                          sx={{
                            borderRadius: '4px',
                            py: 1,
                            px: 1,
                            '&:hover': {
                              backgroundColor: blue['50'],
                            },
                            justifyContent: 'start',
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();

                            await item.handler(e);

                            onClose();
                          }}
                        >
                          {IconComponent ? (
                            <ListItemIcon
                              sx={{ minWidth: 0, color: 'inherit', pr: 1 }}
                            >
                              <IconComponent
                                sx={{
                                  fontSize: '16px',
                                  color: '#000000',
                                }}
                              />
                            </ListItemIcon>
                          ) : (
                            <Box width={'16px'} mr={1} />
                          )}
                          <Typography
                            fontSize={'inherit'}
                            sx={{
                              color: '#000000',
                            }}
                          >
                            {item.label}
                          </Typography>
                        </ListItemButton>
                      </Box>
                    );
                  })}
                </Stack>
              )}
              {children}
            </>
          </Box>
        </ClickAwayListener>
      </StyledPopper>
    </>
  );
};
