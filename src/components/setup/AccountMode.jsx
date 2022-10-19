import { useEffect, useState } from 'react';
import { Button, Box, Text, Col, Paper, Group, Divider } from '@mantine/core';
import { appStore, beetStore } from '../../lib/states';

import Connect from "../beet/Connect";
import BeetLink from "../beet/BeetLink";
import AccountSearch from "../blockchain/AccountSearch";

export default function AccountMode(properties) {
  let setMode = appStore((state) => state.setMode); 
  let setEnvironment = appStore((state) => state.setEnvironment);

  let accountType = appStore((state) => state.accountType); 
  let setAccountType = appStore((state) => state.setAccountType); 
  
  let setNodes = appStore((state) => state.setNodes);
  let nodes = appStore((state) => state.nodes);

  let account = appStore((state) => state.account);
  let setAccount = appStore((state) => state.setAccount);

  let backCallback = properties.backCallback;

  const [inProgress, setInProgress] = useState(false);

  // for beet use
  let connection = beetStore((state) => state.connection);
  let isLinked = beetStore((state) => state.isLinked);
  let identity = beetStore((state) => state.identity);
  let reset = beetStore((state) => state.reset);

  useEffect(() => {
    setNodes();
  }, []);

  useEffect(() => {
    console.log({
      account,
      identity
    })
    if (!account && identity && identity.requested.account && identity.requested.account.id) {
      setAccount(identity.requested.account.id)
    }
  }, [account, identity]);

  const prompt = <span>
                    <Text size="md">
                      For the account "{account ?? '???'}" what do you want to do?
                    </Text>
                    <Group position="center" sx={{marginTop: '5px', paddingTop: '5px'}}>
                      <Button
                        sx={{marginTop: '15px', marginRight: '5px', marginLeft: '5px'}}
                        onClick={() => {
                          setMode('create');
                        }}
                      >
                        Create NFT
                      </Button>
                      <Button
                        sx={{marginTop: '15px', marginRight: '5px'}}
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        Edit NFT
                      </Button>
                    </Group>
                    <Group position="center" sx={{marginTop: '5px', paddingTop: '5px'}}>
                      <Button
                        onClick={() => {
                          backCallback()
                        }}
                      >
                        Back
                      </Button>
                    </Group>
                  </span>;

  let response;
  if (!accountType) {
    response = <span>
                  <Text size="md">
                    Please provide an account id/name:
                  </Text>
                  <Group position="center" sx={{marginTop: '5px', paddingTop: '5px'}}>
                    <Button
                      sx={{m: 0.25}}
                      variant="outline"
                      onClick={() => {
                        setAccountType('BEET');
                      }}
                    >
                      Ask BEET
                    </Button>
                    <Button
                      sx={{m: 0.25}}
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
                  <Group position="center" sx={{marginTop: '5px', paddingTop: '5px'}}>
                    <Button
                      variant="light"
                      onClick={() => {
                        backCallback()
                      }}
                    >
                      Back
                    </Button>
                  </Group>
                </span>;
  } else if (accountType === "BEET") {
    if (!connection) {
      response = <span>
                  <Text size="md">
                    To continue please connect to Beet.
                  </Text>
                  <Connect nftPage={false} backCallback={() => setAccountType()} />
                </span>
    } else if (!isLinked) {
      response = <span>
                  <Text size="md">
                    To continue please link with Beet.
                  </Text>
                  <BeetLink />
                </span>;
    } else if (inProgress) {
      response = <span>
                    <Loader variant="dots" />
                    <Text size="md">
                      Waiting on user response from BEET client
                    </Text>
                </span>;
    } else {
      response = prompt;
    }
  } else if (accountType === "Search") {
    if (!account) {
      response = <span>
                  <AccountSearch />
                  <Button
                    onClick={() => {
                      setAccountType()
                    }}
                  >
                    Back
                  </Button>
                </span>
    } else {
      response = prompt;
    }
  }
  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {response}
        </Box>
      </Paper>
    </Col>
  );
}
