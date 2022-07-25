
import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider, Loader } from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

export default function SelectAsset(properties) {
  const setAsset = properties.setAsset;
  const setMode = properties.setMode;
  const setNodes = properties.setNodes;

  const setProdConnection = properties.setProdConnection;
  const setTestnetConnection = properties.setTestnetConnection;

  const environment = properties.environment;
  const nodes = properties.nodes;
  const userID = properties.userID;
  const wsURL = properties.wsURL;

  const [account, setAccount] = useState();
  const [tries, setTries] = useState(0);

  function increaseTries() {
    let newTries = tries + 1;
    setAccount();
    setTries(newTries);
  }
  
  function changeURL() {
    let nodesToChange = nodes;
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    setNodes(nodesToChange);
    console.log(`Setting new node connection to: ${nodesToChange[0].url}`)
    if (environment === 'production') {
      setProdConnection(nodesToChange[0].url);
    } else {
      setTestnetConnection(nodesToChange[0].url);
    }
  }

  useEffect(() => {
    async function fetchAccounts() {
      try {
        await Apis.instance(wsURL, true).init_promise;
      } catch (error) {
        console.log(error);
        changeURL();
        return;
      }
      
      let fullAccounts;
      try {
        fullAccounts = await Apis.instance().db_api().exec( "get_full_accounts", [[userID], true])
      } catch (error) {
        console.log(error);
        return;
      }
      
      let accountAssets = fullAccounts[0][1].assets;

      let assetsDetails;
      try {
        assetsDetails = await Apis.instance().db_api().exec( "get_assets", [accountAssets, true])
      } catch (error) {
        console.log(error);
        return;
      }

      setAccount(assetsDetails);
    }
    fetchAccounts();
  }, [userID, tries]);
  
  let topText;
  if (!account) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="md">
                  Retrieving info on your Bitshares account
                </Text>
              </span>;
  } else if (!account.length) {
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
                  Made a mistake during issuance? Edit it!
                </Text>
                <Text size="sm" weight={600}>
                  Select the NFT you wish to edit.
                </Text>
              </span>
  }

  let buttonList = account
      ? account.map(asset => {
          return <span position="center" key={`button.${asset.id}`}>
                  <Button
                    compact
                    sx={{margin: '2px'}}
                    variant="outline"
                    onClick={() => {
                      setAsset(asset.id)
                    }}
                  >
                    {asset.symbol}: {asset.id}
                  </Button>
                </span>
        })
      : null;

  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      {
        topText
      }
      {
        buttonList
      }
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
          setMode()
        }}
      >
        Back
      </Button>
    </Box>
  );
}
