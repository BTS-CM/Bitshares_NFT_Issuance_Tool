import React, { useState, useEffect } from 'react';
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Button,
  Text,
  Title,
} from '@mantine/core';

import {
  HiOutlineHome,
} from "react-icons/hi";
import {
  appStore, tempStore,
} from '../lib/states';

import Environment from '../components/setup/Environment';
import GetAccount from '../components/beet/GetAccount';
import Offline from '../components/setup/Offline';
import SelectAsset from '../components/blockchain/SelectAsset';

export default function Edit(properties) {
  const { t, i18n } = useTranslation();
  const nodes = appStore((state) => state.nodes);
  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);
  const asset = tempStore((state) => state.asset);
  const resetTemp = tempStore((state) => state.reset);

  const clearAssets = tempStore((state) => state.clearAssets);

  useEffect(() => {
    resetTemp();
  }, []);

  if (!environment) {
    return (
      <>
        <Title order={4}>
          {t('headers:edit.environment')}
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

  if (!nodes || !nodes[environment] || !nodes[environment].length) {
    return (
      <>
        <Title order={4}>
          {t('headers:edit.offline')}
        </Title>
        <Offline />
        <Button
          variant="outline"
          mt="sm"
          onClick={() => {
            setEnvironment();
          }}
        >
          {t('setup:accountMode.back')}
        </Button>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <Title order={4}>
          {t('headers:edit.account')}
        </Title>
        <GetAccount basic token={environment} env={environment} />
        <Button
          variant="outline"
          mt="sm"
          onClick={() => {
            setEnvironment();
          }}
        >
          {t('setup:accountMode.back')}
        </Button>
      </>
    );
  }

  if (!asset) {
    return (
      <>
        <Title order={4}>
          {t('headers:edit.asset')}
        </Title>
        <SelectAsset userID={account} />
        <Button
          variant="outline"
          mt="sm"
          onClick={() => {
            setAccount();
            clearAssets();
          }}
        >
          {t('setup:accountMode.back')}
        </Button>
      </>
    );
  }

  return (
    <Navigate to="/dashboard" replace={true} />
  );
}
