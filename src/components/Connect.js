import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, Loader } from '@mantine/core';
import { connect } from 'beet-js';

export default function Connect(properties) {
  const connection = properties.connection;
  const setConnection = properties.setConnection;
  const setAuthenticated = properties.setAuthenticated;

  const [inProgress, setInProgress] = useState(false);

  function beetDownload() {
    window.electron.beetDownload('launch');
  }

  async function connectToBeet() {
    setInProgress(true);
    let connected;
    try {
      connected = await connect(
        "NFT Issuance tool",
        "Application",
        "localhost",
        connection ? connection : null,
        connection && connection.identity ? connection.identity : null
      );
    } catch (error) {
      console.error(error)
    }

    if (!connected) {
      console.error("Couldn't connect to Beet");
      setConnection(null);
      setAuthenticated(null);
      setInProgress(false);
      return;
    }

    setConnection(connected);
    setInProgress(false);
    setAuthenticated(connected.authenticated);
  }


  
  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      {
        inProgress === false && !connection
          ? <span>
              <Text size="md">
                This tool is designed for use with the Bitshares BEET Wallet.
              </Text>
              <Text size="md">
                Launch and unlock it, then click the connect button below to proceed.
              </Text>
              <Button
                sx={{marginTop: '15px', marginRight: '5px'}}
                onClick={() => {
                  beetDownload()
                }}
              >
                Download BEET
              </Button>
              <Button
                sx={{marginTop: '15px'}}
                onClick={() => {
                  connectToBeet()
                }}
              >
                Connect to Beet
              </Button>
            </span>
          : <span>
              <Loader variant="dots" />
              <Text size="md">
                Connecting to BEET
              </Text>
            </span>
      }
    </Box>
  );
}
