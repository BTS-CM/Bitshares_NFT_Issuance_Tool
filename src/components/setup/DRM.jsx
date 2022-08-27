import { useEffect, useState } from 'react';
import { Button, Box, Text, Loader, Col, Paper } from '@mantine/core';
import { appStore, beetStore } from '../../lib/states';

export default function DRM(properties) {
  const userID = properties.userID;
  let cdkey = appStore((state) => state.cdkey);
  let fetchKey = appStore((state) => state.fetchKey);
  let resetApp = appStore((state) => state.reset);
  let resetBeet = beetStore((state) => state.reset);

  const [tries, setTries] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  function back() {
    resetBeet();
    resetApp();
  }

  function increaseTries() {
    let newTries = tries + 1;
    setTries(newTries);
  }
  
  function openGallery() {
    window.electron.openURL('gallery');
  }

  useEffect(() => {
    setInProgress(true);

    async function check() {
      await fetchKey(userID);
      setInProgress(false);
    }
    check();
  }, [userID, tries]);
  
  let topText;
  if (inProgress) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="sm" weight={600}>
                    Checking your Bitshares account...
                </Text>
              </span>;
  } else if (!cdkey || !cdkey.length) {
    topText = <span>
                <Text size="sm" weight={600}>
                    Unfortunately, your Bitshares account cannot access this tool at this time.
                </Text>
                <Text size="sm" weight={600}>
                    Your account must either have 100,000 BTS or an NFTEA NFT in its portfolio to proceed.
                </Text>
                <Text size="sm" weight={600}>
                    Everyone is however entirely free to use this tool on the Bitshares testnet blockchain.
                </Text>
              </span>
  }

  let tryAgain;
  if (!cdkey || !cdkey.length) {
    tryAgain = <span>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px'}}
                    onClick={() => {
                      openGallery()
                    }}
                  >
                    NFTEA NFTs
                  </Button>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px'}}
                    onClick={() => {
                      increaseTries()
                    }}
                  >
                    Check again
                  </Button>
                </span>;
  }

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {
            topText
          }
          {
            tryAgain
          }
          <Button
            sx={{marginTop: '15px'}}
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
