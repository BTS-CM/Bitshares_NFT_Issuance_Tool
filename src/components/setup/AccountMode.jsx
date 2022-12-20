import React, { useEffect, useState } from 'react';
import {
  Button, Box, Text, Col, Paper, Group, Divider, Loader,
} from '@mantine/core';
import { appStore, beetStore } from '../../lib/states';

import Connect from '../beet/Connect';
import BeetLink from '../beet/BeetLink';
import AccountSearch from '../blockchain/AccountSearch';

export default function AccountMode(properties) {
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
    console.log({
      account,
      identity,
    });
    if (!account && identity && identity.requested.account && identity.requested.account.id) {
      setAccount(identity.requested.account.id);
    }
  }, [account, identity]);

  const prompt = (
    <span>
      <Text size="md">
        For the account &quot;
        {account ?? '???'}
        &quot; what do you want to do?
      </Text>
      <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px', marginLeft: '5px' }}
          onClick={() => {
            setMode('create');
          }}
        >
          Create NFT
        </Button>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px' }}
          onClick={() => {
            setMode('edit');
          }}
        >
          Edit NFT
        </Button>
        <Button
          sx={{ marginTop: '15px', marginRight: '5px' }}
          onClick={() => {
            setMode('load');
          }}
        >
          Load draft
        </Button>
      </Group>
      <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
        <Button
          onClick={() => {
            backCallback();
          }}
        >
          Back
        </Button>
      </Group>
    </span>
  );

  let response;
  if (!accountType) {
    response = (
      <span>
        <Text size="md">Please provide an account id/name:</Text>
        <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
          <Button
            sx={{ m: 0.25 }}
            variant="outline"
            onClick={() => {
              setAccountType('BEET');
            }}
          >
            Ask BEET
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
            Lookup account manually
          </Button>
        </Group>
        <Group position="center" sx={{ marginTop: '5px', paddingTop: '5px' }}>
          <Button
            variant="light"
            onClick={() => {
              backCallback();
            }}
          >
            Back
          </Button>
        </Group>
      </span>
    );
  } else if (accountType === 'BEET') {
    if (!connection) {
      response = (
        <span>
          <Text size="md">To continue please connect to Beet.</Text>
          <Connect nftPage={false} backCallback={() => setAccountType()} />
        </span>
      );
    } else if (!isLinked) {
      response = (
        <span>
          <Text size="md">To continue please link with Beet.</Text>
          <BeetLink />
        </span>
      );
    } else if (inProgress) {
      response = (
        <span>
          <Loader variant="dots" />
          <Text size="md">Waiting on user response from BEET client</Text>
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
            Back
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
