import { useEffect, useState } from 'react';
import { Button, Box, Text, Col, Paper } from '@mantine/core';
import { appStore } from '../../lib/states';

export default function Offline(properties) {
  const setMode = appStore((state) => state.setMode);

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          <span>
            <Text size="md">
              You seem to be offline? Fix your network connection then try again.
            </Text>
            <Button
              sx={{marginTop: '15px', marginRight: '5px', marginLeft: '5px'}}
              onClick={() => {
                setMode();
              }}
            >
              Exit
            </Button>
          </span>
        </Box>
      </Paper>
    </Col>
  );
}
