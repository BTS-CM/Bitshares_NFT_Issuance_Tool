import React, { useEffect, useState } from 'react';
import {
  Button, Group, Box, Text, Divider, SimpleGrid, Loader, Col, Paper,
} from '@mantine/core';
import { appStore } from '../../lib/states';

export default function SelectAsset(properties) {
  const setAsset = appStore((state) => state.setAsset);
  const setMode = appStore((state) => state.setMode);
  const changeURL = appStore((state) => state.changeURL);

  const fetchIssuedAssets = appStore((state) => state.fetchIssuedAssets);
  const clearAssets = appStore((state) => state.clearAssets);

  const assets = appStore((state) => state.assets);
  const nonNFTs = appStore((state) => state.nonNFTs);

  const { userID } = properties;
  const [tries, setTries] = useState(0);

  function increaseTries() {
    const newTries = tries + 1;
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
      }
    }
    issuedAssets();
  }, [userID, tries]);

  let topText = null;
  if (!assets && !nonNFTs) {
    topText = (
      <span>
        <Loader variant="dots" />
        <Text size="md">Retrieving info on your Bitshares account</Text>
      </span>
    );
  } else if (assets && !assets.length) {
    topText = (
      <span>
        <Text size="md">No NFTs to edit</Text>
        <Text size="sm" weight={400}>
          This Bitshares account hasn&apos;t issued any NFTs on the BTS DEX.
        </Text>
        <Text size="sm" weight={400}>
          You can either create a new NFT or switch Bitshares account.
        </Text>
        <Text size="sm" weight={400}>
          Note: Buying an NFT on the BTS DEX doesn&apos;t automatically grant you NFT editing
          rights.
        </Text>
      </span>
    );
  } else {
    topText = (
      <span>
        <Text size="md">Select the NFT you wish to edit</Text>
      </span>
    );
  }

  const buttonList = assets
    ? assets.map((asset) => (
      <Button
        compact
        sx={{ margin: '2px' }}
        variant="outline"
        key={`button.${asset.id}`}
        onClick={() => {
          chosenAsset(asset);
        }}
      >
        {asset.symbol}
        :
        {asset.id}
      </Button>
    ))
    : null;

  const normalAssetList = nonNFTs
    ? nonNFTs.map((asset) => (
      <Button
        compact
        sx={{ margin: '2px' }}
        variant="outline"
        key={`button.${asset.id}`}
        onClick={() => {
          chosenAsset(asset);
        }}
      >
        {asset.symbol}
        :
        {asset.id}
      </Button>
    ))
    : null;

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{ padding: '10px' }}>
          {topText}
          <SimpleGrid cols={3} sx={{ marginTop: '10px' }}>
            {buttonList}
          </SimpleGrid>

          {
            nonNFTs && nonNFTs.length ? (
              <span>
                <Divider />
                <Text size="md">The following assets are not yet NFTs</Text>
                <Text size="sm" weight={400}>
                  Why not introduce NFT functionality to your existing Bitshares assets?
                </Text>
              </span>
            ) : null
          }
          <SimpleGrid cols={3} sx={{ marginTop: '10px' }}>
            {normalAssetList}
          </SimpleGrid>

          <Button
            sx={{ marginTop: '15px', marginRight: '5px' }}
            onClick={() => {
              increaseTries();
            }}
          >
            Refresh
          </Button>
          <Button
            sx={{ marginTop: '15px' }}
            onClick={() => {
              goBack();
            }}
          >
            Back
          </Button>
        </Box>
      </Paper>
    </Col>
  );
}
