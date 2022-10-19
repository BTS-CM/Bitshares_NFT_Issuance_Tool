
import { useState } from 'react';
import { 
  TextInput,
  ActionIcon,
  useMantineTheme,
  Button,
  Box,
  Text,
  Loader,
  Col,
  Alert,
  Paper,
  SimpleGrid
} from '@mantine/core';
import { IconSearch, IconArrowRight, IconAlertCircle } from '@tabler/icons';
import { appStore, beetStore, identitiesStore } from '../../lib/states';
import { accountSearch } from '../../lib/queries';

export default function AccountSearch(properties) {
  const theme = useMantineTheme();

  let setAccount = appStore((state) => state.setAccount);
  let nodes = appStore((state) => state.nodes);
  let goBack = appStore((state) => state.back);

  const [searchInput, setSearchInput] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState();
  const [attempted, setAttempted] = useState();

  function back() {
    goBack();
  }
  
  /**
   * @param {Object} account 
   */
  function chosenAccount(account) {
    setAccount(account);
  }

  async function performSearch() {
    setAttempted(true);
    setInProgress(true);
    setResult();

    if (!nodes || !nodes.length) {
      console.log('No connected nodes')
      return;
    }

    let searchResult;
    try {
      searchResult = await accountSearch(nodes[0], searchInput)
    } catch (error) {
      console.log(error);
      setInProgress(false);
      return;
    }
    
    if (searchResult) {
      setResult(searchResult[0])
    }

    setInProgress(false);
  }

  let topText;
  if (!searchInput || !attempted) {
    topText = <span>
                <Text size="md">
                  Enter your blockchain account ID/name to proceed
                </Text>
              </span>
  } else if (inProgress) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="md">
                  Looking up account
                </Text>
              </span>;
  } else if (!inProgress && !result && attempted) {
    topText = <span>
                <Text size="md">
                  No such account could be found, check input and try again.
                </Text>
              </span>
  } else if (attempted && result) {
    topText = <span>
                <Text size="md">
                  Search results
                </Text>
              </span>
  }

  if (!nodes) {
    return <span>
            <Loader variant="dots" />
            <Text size="md">
              Loading...
            </Text>
          </span>
  }

  return (
    <Col span={12}>
        <Box mx="auto" sx={{padding: '10px'}}>
          {
            topText
          }

          {
            !inProgress
              ? <TextInput
                  icon={<IconSearch size={18} stroke={1.5} />}
                  radius="xl"
                  size="md"
                  onChange={e => {
                    setSearchInput(e.target.value)
                    setAttempted();
                  }}
                  rightSection={
                    <ActionIcon
                      size={32}
                      radius="xl"
                      color={theme.primaryColor}
                      onClick={() => {
                        performSearch()
                      }}
                      variant="filled"
                    >
                        <IconArrowRight size={18} stroke={1.5} />
                    </ActionIcon>
                  }
                  placeholder="Account ID (e.g. 1.2.0)"
                  rightSectionWidth={42}
                />
              : null
          }

          <SimpleGrid cols={3} sx={{marginTop: '10px'}}>
            {
              result
                ? <Button
                    compact
                    sx={{margin: '2px'}}
                    variant="outline"
                    key={`button.${result.name}`}
                    onClick={() => {
                      chosenAccount(result.id)
                    }}
                  >
                    {result.id} ({result.name})
                  </Button>
                : null
            }
          </SimpleGrid>
        </Box>
    </Col>
  );
}
