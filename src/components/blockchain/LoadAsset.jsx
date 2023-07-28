import React from 'react';
import { Link } from "react-router-dom";
import {
  Button, Group, Box, Text, SimpleGrid, Col, Paper,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { identitiesStore, tempStore } from '../../lib/states';

export default function LoadAsset(properties) {
  const { t, i18n } = useTranslation();
  const drafts = identitiesStore((state) => state.drafts);
  const eraseDraft = identitiesStore((state) => state.eraseDraft);
  const setAssetImages = tempStore((state) => state.setAssetImages);
  const setInitialValues = tempStore((state) => state.setInitialValues);

  let topText;
  if (!drafts || !drafts.length) {
    topText = (
      <span>
        <Text size="md">
          {t('blockchain:loadAsset.noHeader')}
        </Text>
        <Text size="sm" weight={600}>
          {t('blockchain:loadAsset.noSubHeader')}
        </Text>
      </span>
    );
  } else {
    topText = (
      <span>
        <Text size="md">
          {t('blockchain:loadAsset.draftHeader')}
        </Text>
      </span>
    );
  }

  const buttonList = drafts && drafts.length
    ? drafts.map((initialValues) => (
      <Group spacing="xs" key={`button.${initialValues.values.symbol}`}>
        <Link style={{ textDecoration: 'none' }} to="/createNFT/edit">
          <Button
            compact
            sx={{ margin: '2px' }}
            variant="outline"
            onClick={() => {
              setInitialValues(initialValues.values);
              setAssetImages(initialValues.asset_images);
            }}
          >
            {initialValues.values.symbol}
          </Button>
        </Link>
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
        </Box>
      </Paper>
      <Link style={{ textDecoration: 'none' }} to="/">
        <Button
          mt="sm"
          compact
          sx={{ marginTop: '15px' }}
        >
          {t('blockchain:loadAsset.back')}
        </Button>
      </Link>
    </Col>
  );
}
