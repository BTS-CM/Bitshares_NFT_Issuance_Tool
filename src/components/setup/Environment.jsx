import { Button, Box, Text, Col, Paper } from '@mantine/core';
import { appStore } from '../../lib/states';

export default function Mode(properties) {
  const setEnvironment = appStore((state) => state.setEnvironment); 
  
  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          <span>
            <Text size="md">
              Which Bitshares blockchain do you want to use?
            </Text>
            <Button
              sx={{marginTop: '15px', marginRight: '5px', marginLeft: '5px'}}
              onClick={() => {
                setEnvironment('testnet');
              }}
            >
              Testnet (BTS_TEST)
            </Button>
            <Button
              sx={{marginTop: '15px', marginRight: '5px'}}
              onClick={() => {
                setEnvironment('production');
              }}
            >
              Production (BTS)
            </Button>
          </span>
        </Box>
      </Paper>
    </Col>
  );
}
