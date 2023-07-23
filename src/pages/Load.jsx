import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import {
  Button, Group, Box, Text, Divider, SimpleGrid, Loader, Col, Paper, Title,
} from '@mantine/core';

import {
  HiOutlineHome,
} from "react-icons/hi";

import {
  appStore, tempStore, identitiesStore,
} from '../lib/states';
import Environment from '../components/setup/Environment';

export default function Load(properties) {
  const { t, i18n } = useTranslation();

  const drafts = identitiesStore((state) => state.drafts);
  const eraseDraft = identitiesStore((state) => state.eraseDraft);
  const setAssetImages = tempStore((state) => state.setAssetImages);
  const setInitialValues = tempStore((state) => state.setInitialValues);

  const resetTemp = tempStore((state) => state.reset);
  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);

  useEffect(() => {
    resetTemp();
    setEnvironment();
  }, []);

  if (!environment) {
    return (
      <>
        <Title order={4}>
          {t('headers:load.environment')}
        </Title>
        <Environment />
        <Link style={{ textDecoration: 'none' }} to="/">
          <Button
            compact
            sx={{ margin: '2px' }}
            variant="outline"
            leftIcon={<HiOutlineHome />}
          >
            {t("app:menu.home")}
          </Button>
        </Link>
      </>
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
    <>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{ padding: '10px' }}>
          {
            !drafts || !drafts.length
              ? (
                <>
                  <Text size="md">
                    {t('blockchain:loadAsset.noHeader')}
                  </Text>
                  <Text size="sm" weight={600}>
                    {t('blockchain:loadAsset.noSubHeader')}
                  </Text>
                </>
              )
              : (
                <Text size="md">
                  {t('blockchain:loadAsset.draftHeader')}
                </Text>
              )
          }
          <SimpleGrid cols={3} sx={{ marginTop: '10px' }}>
            {buttonList}
          </SimpleGrid>
        </Box>
      </Paper>
      <Button
        mt="sm"
        compact
        sx={{ marginTop: '15px' }}
        onClick={() => {
          setEnvironment();
        }}
      >
        {t('blockchain:loadAsset.back')}
      </Button>
    </>
  );
}
