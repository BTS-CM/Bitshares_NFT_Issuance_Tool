import React, { useEffect, useState } from 'react';
import {
  Button, Group, Box, Text, Divider, SimpleGrid, Loader, Col, Paper,
} from '@mantine/core';
import { appStore, identitiesStore } from '../../lib/states';

export default function LoadAsset(properties) {
  const setMode = appStore((state) => state.setMode);
  const drafts = identitiesStore((state) => state.drafts);
  const setInitialValues = appStore((state) => state.setInitialValues);
  const eraseDraft = identitiesStore((state) => state.eraseDraft);
  const setAssetImages = appStore((state) => state.setAssetImages);

  function goBack() {
    setMode();
  }

  let topText;
  if (!drafts || !drafts.length) {
    topText = (
      <span>
        <Text size="md">Nothing to edit</Text>
        <Text size="sm" weight={600}>
          You have not saved any NFT drafts yet.
        </Text>
      </span>
    );
  } else {
    topText = (
      <span>
        <Text size="md">Select the NFT draft you wish to edit</Text>
      </span>
    );
  }

  const buttonList = drafts && drafts.length
    ? drafts.map((initialValues) => (
      <Group spacing="xs" key={`button.${initialValues.values.symbol}`}>
        <Button
          compact
          sx={{ margin: '2px' }}
          variant="outline"
          onClick={() => {
            setMode('create')
            setInitialValues(initialValues.values);
            setAssetImages(initialValues.asset_images);
          }}
        >
          {initialValues.values.symbol}
        </Button>
        <Button
          compact
          variant="outline"
          sx={{ margin: '2px' }}
          onClick={() => {
            eraseDraft(initialValues.values.symbol);
          }}
        >
          ❌
        </Button>
      </Group>
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
