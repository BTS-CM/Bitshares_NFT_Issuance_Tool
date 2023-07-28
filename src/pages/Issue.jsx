import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
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
import IssueNFT from '../components/blockchain/IssueNFT';
import SelectAsset from '../components/blockchain/SelectAsset';

export default function Issue(properties) {
  const { t, i18n } = useTranslation();
  const nodes = appStore((state) => state.nodes);
  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);
  const asset = tempStore((state) => state.asset);
  const eraseAsset = tempStore((state) => state.eraseAsset);
  const resetTemp = tempStore((state) => state.reset);

  useEffect(() => {
    resetTemp();
  }, []);

  if (!environment) {
    return (
      <>
        <Title order={4}>
          {t('headers:issue.environment')}
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
          {t('headers:issue.offline')}
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
          {t('headers:issue.account')}
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
        <SelectAsset userID={account} location="issue" />
        <Button
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
    <>
      <IssueNFT userID={account} />
      <Button
        onClick={() => {
          eraseAsset();
        }}
      >
        {t('setup:accountMode.back')}
      </Button>
    </>
  );
}
