import { Loader, Box, Text, Col, Paper } from '@mantine/core';
import { appStore } from '../../lib/states';

export default function Offline(properties) {
  const setMode = appStore((state) => state.setMode);

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          <span>
            <Text size="md">
              Finding fastest blockchain connection, please wait..
            </Text>
            <Loader variant="dots" />
          </span>
        </Box>
      </Paper>
    </Col>
  );
}
