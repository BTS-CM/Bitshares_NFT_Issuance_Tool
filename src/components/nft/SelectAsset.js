
import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider } from '@mantine/core';
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
  
  function changeURL() {
    let nodesToChange = nodes;
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    setNodes(nodesToChange);
    console.log(`Setting new node connection to: ${nodesToChange[0]}`)
    if (environment === 'production') {
      setProdConnection(nodesToChange[0]);
    } else {
      setTestnetConnection(nodesToChange[0]);
    }
  }

  useEffect(() => {
    async function fetchAccounts() {
      try {
        await Apis.instance(wsURL, true).init_promise;
      } catch (error) {
        console.log(error);
        changeURL();
        return fetchAccounts();
      }
      
      let fullAccounts;
      try {
        fullAccounts = await Apis.instance().db_api().exec( "get_full_accounts", [[userID], true])
      } catch (error) {
        console.log(error);
        return;
      }
      
      let accountAssets = fullAccounts[0][1].assets;
      console.log(accountAssets);

      let assetsDetails;
      try {
        assetsDetails = await Apis.instance().db_api().exec( "get_assets", [accountAssets, true])
      } catch (error) {
        console.log(error);
        return;
      }

      setAccount(assetsDetails);

      console.log(assetsDetails)
    }
    fetchAccounts();
  }, [userID]);
  
  let topText;
  if (!account) {
    topText = <Text size="sm" weight={600}>
                Retrieving info on your Bitshares account
              </Text>;
  } else if (!account.length) {
    topText = <Text size="sm" weight={600}>
                You don't seem to be the issuer of any NFTs on Bitshares. Go back and select create instead of edit.
              </Text>
  } else {
    topText = <Text size="sm" weight={600}>
                Select the NFT you wish to edit.
              </Text>
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
