/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  Card,
  Button,
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";
import {
  HiOutlineHome,
} from "react-icons/hi";

import {
  appStore, tempStore,
} from '../lib/states';

import BeetModal from '../components/beet/BeetModal';
import Environment from '../components/setup/Environment';
import GetAccount from '../components/beet/GetAccount';
import Offline from '../components/setup/Offline';

export default function Upgrade(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares',
  );

  const nodes = appStore((state) => state.nodes);
  const environment = appStore((state) => state.environment);
  const setEnvironment = appStore((state) => state.setEnvironment);

  const account = tempStore((state) => state.account);
  const setAccount = tempStore((state) => state.setAccount);
  const resetTemp = tempStore((state) => state.reset);

  useEffect(() => {
    resetTemp();
  }, []);

  if (!environment) {
    return (
      <>
        <Title order={4}>
          {t('headers:upgrade.environment')}
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
          {t('headers:upgrade.offline')}
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
          {t('headers:upgrade.account')}
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

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("upgrade:title")}
        </Title>

        <Text fz="md" style={{ marginTop: '15px' }}>
          {t("upgrade:header")}
        </Text>

        <Text fz="sm" style={{ marginTop: '15px' }}>
          {t("upgrade:secondHeader")}
        </Text>

        <BeetModal
          value={environment}
          opContents={[{
            fee: {
              amount: 0,
              asset_id: "1.3.0",
            },
            account_to_upgrade: account,
            upgrade_to_lifetime_member: true,
            extensions: [],
          }]}
          opType="account_upgrade"
          opNum={11}
          opName="Account upgrade"
          appName="Account_Upgrade"
          requestedMethods={["BEET", "DEEPLINK", "LOCAL", "JSON"]}
          filename="account_upgrade.json"
        />
      </Card>
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
