import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';

export const PathBreadcrumbs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pathSearchParam = searchParams.get('path');
  const link = searchParams.get('link');
  const permissions = searchParams.get('permissions');
  const splittedSearchParams = [
    {
      label: 'All files',
      value: '',
    },
    ...(pathSearchParam
      ?.split('/')
      .filter((param) => !!param)
      .map((param) => ({ label: param, value: param })) || []),
  ];

  const onItemClick = (item: string) => {
    const result = pathSearchParam?.substring(
      0,
      pathSearchParam.indexOf(item) + item.length,
    );

    setSearchParams({
      path: result || '',
      link: link || '',
      permissions: permissions || '',
    });
  };
  return (
    <Stack
      direction={'row'}
      gap={0.5}
      alignItems="center"
      divider={
        <ChevronRightOutlinedIcon sx={{ fontSize: 16, color: '#000000' }} />
      }
    >
      {splittedSearchParams.map((item, i) => {
        const isLast = i + 1 === splittedSearchParams.length;
        return (
          <React.Fragment key={i}>
            <Box
              onClick={() => onItemClick(item.value)}
              sx={{
                cursor: 'pointer',
                padding: 1,
                borderRadius: '10px',
              }}
            >
              <Typography fontSize={16} fontWeight={isLast ? 'bold' : 'normal'}>
                {item.label}
              </Typography>
            </Box>
          </React.Fragment>
        );
      })}
    </Stack>
  );
};
