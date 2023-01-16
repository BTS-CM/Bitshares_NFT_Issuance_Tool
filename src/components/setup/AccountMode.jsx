import React, { useEffect, useState } from 'react';
import {
  Button, Box, Text, Col, Paper, Group, Divider, Loader,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { appStore, beetStore } from '../../lib/states';
import Connect from '../beet/Connect';
import BeetLink from '../beet/BeetLink';
import AccountSearch from '../blockchain/AccountSearch';

export default function AccountMode(properties) {
  const { t, i18n } = useTranslation();
  const setMode = appStore((state) => state.setMode);
  const setEnvironment = appStore((state) => state.setEnvironment);

  const accountType = appStore((state) => state.accountType);
  const setAccountType = appStore((state) => state.setAccountType);

  const setNodes = appStore((state) => state.setNodes);
  const nodes = appStore((state) => state.nodes);

  const account = appStore((state) => state.account);
  const setAccount = appStore((state) => state.setAccount);

  const { backCallback } = properties;

  const [inProgress, setInProgress] = useState(false);

  // for beet use
  const connection = beetStore((state) => state.connection);
  const isLinked = beetStore((state) => state.isLinked);
  const identity = beetStore((state) => state.identity);
  const reset = beetStore((state) => state.reset);

  useEffect(() => {
    setNodes();
  }, []);

  useEffect(() => {
    if (!account && identity && identity.requested.account && identity.requested.account.id) {
      setAccount(identity.requested.account.id);
    }
  }, [account, identity]);

  const prompt = (
    <span>
      <Text size="md">
        {t('setup:accountMode.header', {account: account ?? '???'})}
      </Text>
      <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px', marginLeft: '5px' }}
          onClick={() => {
            setMode('create');
          }}
        >
          {t('setup:accountMode.create')}
        </Button>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px' }}
          onClick={() => {
            setMode('edit');
          }}
        >
          {t('setup:accountMode.edit')}
        </Button>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px' }}
          onClick={() => {
            setMode('issue');
          }}
        >
          {t('setup:accountMode.issue')}
        </Button>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px' }}
          onClick={() => {
            setMode('load');
          }}
        >
          {t('setup:accountMode.draft')}
        </Button>
      </Group>
      <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
        <Button
          onClick={() => {
            backCallback();
          }}
        >
          {t('setup:accountMode.back')}
        </Button>
      </Group>
    </span>
  );

  let response;
  if (!accountType) {
    response = (
      <span>
        <Text size="md">
          {t('setup:accountMode.header2')}
        </Text>
        <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
          <Button
            sx={{ m: 0.25 }}
            variant="outline"
            onClick={() => {
              setAccountType('BEET');
            }}
          >
            {t('setup:accountMode.chooseBEET')}
          </Button>
          <Button
            sx={{ m: 0.25 }}
            variant="outline"
            onClick={() => {
              setAccountType('Search');
              setAccount();
              reset();
            }}
          >
            {t('setup:accountMode.chooseSearch')}
          </Button>
        </Group>
        <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
          <Button
            variant="light"
            onClick={() => {
              backCallback();
            }}
          >
            {t('setup:accountMode.back')}
          </Button>
        </Group>
      </span>
    );
  } else if (accountType === 'BEET') {
    if (!connection) {
      response = (
        <span>
          <Text size="md">{t('setup:accountMode.beetPrompt')}</Text>
          <Connect nftPage={false} backCallback={() => setAccountType()} />
        </span>
      );
    } else if (!isLinked) {
      response = (
        <span>
          <Text size="md">{t('setup:accountMode.linkPrompt')}</Text>
          <BeetLink />
        </span>
      );
    } else if (inProgress) {
      response = (
        <span>
          <Loader variant="dots" />
          <Text size="md">{t('setup:accountMode.waiting')}</Text>
        </span>
      );
    } else {
      response = prompt;
    }
  } else if (accountType === 'Search') {
    if (!account) {
      response = (
        <span>
          <AccountSearch />
          <Button
            onClick={() => {
              setAccountType();
            }}
          >
            {t('setup:accountMode.back')}
          </Button>
        </span>
      );
    } else {
      response = prompt;
    }
  }
  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{ padding: '10px' }}>
          {response}
        </Box>
      </Paper>
    </Col>
  );
}
