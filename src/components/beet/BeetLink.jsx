import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, Loader, Col, Paper } from '@mantine/core';
import { appStore, beetStore } from '../../lib/states';

export default function BeetLink(properties) {
  let environment = appStore((state) => state.environment);
  let setMode = appStore((state) => state.setMode);

  let link = beetStore((state) => state.link);
  let setConnection = beetStore((state) => state.setConnection);
  let setAuthenticated = beetStore((state) => state.setAuthenticated); 

  const [inProgress, setInProgress] = useState(false);

  function back() {
    setConnection();
    setAuthenticated();
    setMode();
  }

  /*
   * After connection attempt to link app to Beet client
   */
  async function _linkToBeet() {  
    setInProgress(true);

    try {
      await link(environment);
    } catch (error) {
      console.error(error)
    }
    
    setInProgress(false);
  }
  
  let linkContents = inProgress === false
  ? <span>
      <Text size="md">
        Connected to Beet wallet successfully.
      </Text>
      <Text size="md">
        Proceed with linking this app to your Beet wallet below.
      </Text>
      <Button
        sx={{marginTop: '15px', marginRight: '5px'}}
        onClick={() => {
          _linkToBeet()
        }}
      >
        Link to Beet
      </Button>
    </span>
  : <span>
      <Loader variant="dots" />
      <Text size="md">
        Waiting on response from BEET prompt
      </Text>
    </span>;

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {linkContents}
          <Button
            sx={{marginTop: '15px', marginRight: '5px'}}
            onClick={() => {
              back()
            }}
          >
            Back
          </Button>
        </Box>
      </Paper>
    </Col>
  );
}
