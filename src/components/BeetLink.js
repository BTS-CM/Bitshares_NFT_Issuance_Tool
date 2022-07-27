import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, Loader, Col, Paper } from '@mantine/core';
import { link } from 'beet-js';

export default function BeetLink(properties) {
  const setIsLinked = properties.setIsLinked;
  const setIdentity = properties.setIdentity;
  const setCrypto = properties.setCrypto;
  const connection = properties.connection;

  const [inProgress, setInProgress] = useState(false);

  /*
   * After connection attempt to link app to Beet client
   */
  async function _linkToBeet(target = "BTS") {
    if (!connection) {
      console.log("Missing Beet connection");
      return;
    }
    
    setInProgress(true);
    let linkAttempt;
    try {
      linkAttempt = await link(target, connection);
    } catch (error) {
      console.error(error)
      setInProgress(false);
      return;
    }

    if (!connection.identity) {
      console.log("Link rejected");
      setInProgress(false);
      return;
    }

    console.log('Successfully linked');
    setIsLinked(true);
    setInProgress(false);
    setIdentity(connection.identity);
    setCrypto(target)
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
          _linkToBeet('BTS')
        }}
      >
        Link to production Bitshares
      </Button>
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          _linkToBeet('BTS_TEST')
        }}
      >
        Link to testnet Bitshares
      </Button>
    </span>
  : <span>
      <Loader variant="dots" />
      <Text size="md">
        Waiting for user to respond to BEET prompt
      </Text>
    </span>;

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {linkContents}
        </Box>
      </Paper>
    </Col>
  );
}
