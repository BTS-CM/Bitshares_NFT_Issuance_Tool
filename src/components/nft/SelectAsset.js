
import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider } from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

export default function SelectAsset(properties) {
  const setAsset = properties.setAsset;
  const setMode = properties.setMode;
  const userID = properties.userID;
  const [account, setAccount] = useState();

  useEffect(() => {
    async function fetchAccounts() {
      try {
        await Apis.instance("wss://node.xbts.io/ws", true).init_promise;
      } catch (error) {
        console.log(error);
        return;
      }
      
      let fullAccounts;
      try {
        //fullAccounts = await Apis.instance().db_api().exec( "get_full_accounts", [[userID], true])
        fullAccounts = await Apis.instance().db_api().exec( "get_full_accounts", [['nftprofessional1'], true])
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
  }, [userID]);
  
  let topText = !account
      ? <Text size="sm" weight={600}>
          Retrieving info on your Bitshares account
        </Text>
      : <Text size="sm" weight={600}>
          Select the NFT you wish to edit.
        </Text>

  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      {
        topText
      }
      {
        account
          ? account.map(asset => {
              return <Group position="center">
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
                    </Group>
            })
          : null
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
