
import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, SimpleGrid, Loader, Col, Paper } from '@mantine/core';
import { appStore } from '../../lib/states';

export default function SelectAsset(properties) {
  let setAsset = appStore((state) => state.setAsset);
  let setMode = appStore((state) => state.setMode);
  let changeURL = appStore((state) => state.changeURL);
  
  let fetchIssuedAssets = appStore((state) => state.fetchIssuedAssets);
  let clearAssets = appStore((state) => state.clearAssets);
  
  let assets = appStore((state) => state.assets);

  const userID = properties.userID;
  const [tries, setTries] = useState(0);

  function increaseTries() {
    let newTries = tries + 1;
    clearAssets();
    setTries(newTries);
  }

  function goBack() {
    setMode();
    clearAssets();
  }
  
  /**
   * User has selected an asset to edit
   * @param {Object} asset 
   */
  function chosenAsset(asset) {
    setAsset(asset);    
  }

  useEffect(() => {
    async function issuedAssets() {
      try {
        await fetchIssuedAssets(userID);
      } catch (error) {
        console.log(error);
        changeURL();
        return;
      }
    }
    issuedAssets();
  }, [userID, tries]);
  
  let topText;
  if (!assets) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="md">
                  Retrieving info on your Bitshares account
                </Text>
              </span>;
  } else if (!assets.length) {
    topText = <span>
                <Text size="md">
                  Nothing to edit
                </Text>
                <Text size="sm" weight={600}>
                  This Bitshares account hasn't issued any NFTs on the BTS DEX.
                </Text>
                <Text size="sm" weight={600}>
                  You can either create a new NFT or switch Bitshares account.
                </Text>
                <Text size="sm" weight={600}>
                  Note: Buying and owning an NFT on the BTS DEX doesn't automatically grant you NFT editing rights.
                </Text>
              </span>
              
  } else {
    topText = <span>
                <Text size="md">
                  Select the NFT you wish to edit
                </Text>
              </span>
  }

  let buttonList = assets
                    ? assets.map(asset => {
                        return <Button
                                  compact
                                  sx={{margin: '2px'}}
                                  variant="outline"
                                  key={`button.${asset.id}`}
                                  onClick={() => {
                                    chosenAsset(asset)
                                  }}
                                >
                                  {asset.symbol}: {asset.id}
                                </Button>
                      })
                    : null;

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {
            topText
          }
          <SimpleGrid cols={3} sx={{marginTop: '10px'}}>
            {
              buttonList
            }
          </SimpleGrid>

          <Button
            sx={{marginTop: '15px', marginRight: '5px'}}
            onClick={() => {
              increaseTries()
            }}
          >
            Refresh
          </Button>
          <Button
            sx={{marginTop: '15px'}}
            onClick={() => {
              goBack()
            }}
          >
            Back
          </Button>
        </Box>
      </Paper>
    </Col>
  );
}
