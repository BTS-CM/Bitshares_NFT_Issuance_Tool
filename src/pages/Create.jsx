import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from "react-router-dom";
import {
  Title,
  Button,
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
import Offchain from '../components/images/Offchain';
import Wizard from '../components/blockchain/Wizard';

export default function Create(properties) {
  const { t, i18n } = useTranslation();
  const nodes = appStore((state) => state.nodes);
  const params = useParams();
  const { mode } = params;

  const resetTemp = tempStore((state) => state.reset);

  useEffect(() => {
    if (mode === 'create') {
      resetTemp();
    }
  }, []);

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);
  const asset_images = tempStore((state) => state.asset_images);
  const changing_images = tempStore((state) => state.changing_images);

  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);
  if (!environment) {
    return (
      <>
        <Title order={4}>
          {t('headers:create.environment')}
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
          {t('headers:create.offline')}
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
          {t('headers:create.account')}
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

  if (!asset_images || changing_images === true) {
    return (
      <>
        <Title order={4}>
          {t('headers:create.images')}
        </Title>
        <Offchain />
        <Button
          variant="outline"
          mt="sm"
          onClick={() => {
            setAccount();
          }}
        >
          {t('setup:accountMode.back')}
        </Button>
      </>
    );
  }

  return (
    <Wizard userID={account} mode={mode} />
  );
}
