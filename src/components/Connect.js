import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, Loader, Col, Paper, Checkbox } from '@mantine/core';
import { connect, checkBeet } from 'beet-js';

export default function Connect(properties) {
  const connection = properties.connection;
  const setConnection = properties.setConnection;
  const setAuthenticated = properties.setAuthenticated;

  const [inProgress, setInProgress] = useState(false);

  function beetDownload() {
    window.electron.openURL('github');
  }

  async function connectToBeet() {
    setInProgress(true);

    let beetOnline;
    try {
      beetOnline = await checkBeet(true);
    } catch (error) {
      console.log(error);
    }

    if (!beetOnline) {
      setInProgress(false);
      return;
    }

    let connected;
    try {
      connected = await connect(
        "NFT Issuance tool",
        "Application",
        "localhost"
      );
    } catch (error) {
      console.error(error)
    }

    console.log('after')

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

  let response;
  if (inProgress === false && !connection) {
    response = <span>
                <Col span={12}>
                  <Paper padding="sm" shadow="xs">
                    <Box mx="auto" sx={{padding: '10px'}}>
                      <Text size="md">
                        This tool is designed for use with the Bitshares BEET Wallet.
                      </Text>
                      <Text size="md">
                        Launch and unlock it, then click the connect button below to proceed.
                      </Text>
                      <Button
                        sx={{marginTop: '15px'}}
                        onClick={() => {
                          connectToBeet()
                        }}
                      >
                        Connect to Beet
                      </Button>  
                    </Box>
                  </Paper>
                </Col>
                <Col span={12}>
                  <Paper padding="sm" shadow="xs">
                    <Box mx="auto" sx={{padding: '10px', paddingTop: '10px'}}>
                      <Text size="md">
                        Don't yet have the Bitshares BEET wallet installed? Follow the link below.
                      </Text>
                      <Text size="md">
                        Once installed, create a wallet for the Bitshares NFT issuing account and proceed to connect above.
                      </Text>
                      <Button
                        sx={{marginTop: '15px', marginRight: '5px'}}
                        onClick={() => {
                          beetDownload()
                        }}
                      >
                        Download BEET
                      </Button>
                    </Box>
                  </Paper>
                </Col>              
              </span>;
  } else {
    response = <Box mx="auto" sx={{padding: '10px'}}>
                  <span>
                    <Loader variant="dots" />
                    <Text size="md">
                      Connecting to BEET
                    </Text>
                  </span>
                </Box>;
    
  }
  
  return (response);
}
