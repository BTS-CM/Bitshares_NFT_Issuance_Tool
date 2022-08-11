import { useEffect, useState } from 'react';
import { Button, Box, Text, Loader, Col, Paper } from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

const accessPasses = {
  "BTS": 100000,
  "NFTEA": 1
}

export default function DRM(properties) {
  const setCDKey = properties.setCDKey;
  const userID = properties.userID;
  const nodes = properties.nodes;
  const environment = properties.environment;

  const setNodes = properties.setNodes;
  const setProdConnection = properties.setProdConnection;
  const setTestnetConnection = properties.setTestnetConnection;
  const setConnection = properties.setConnection;

  const setIsLinked = properties.setIsLinked;
  const setIdentity = properties.setIdentity;
  const setCrypto = properties.setCrypto;

  const [balances, setBalances] = useState();
  const [tries, setTries] = useState(0);
  
  function back() {
    setIsLinked();
    setIdentity();
    setCrypto();
    setNodes();
    setProdConnection();
    setTestnetConnection();
    setConnection();
  }

  function increaseTries() {
    let newTries = tries + 1;
    setBalances();
    setTries(newTries);
  }

  function changeURL() {
    let nodesToChange = nodes;
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    setNodes(nodesToChange);

    if (environment === 'production') {
      setProdConnection(nodesToChange[0]);
    } else {
      setTestnetConnection(nodesToChange[0]);
    }
  }
  
  function openGallery() {
    window.electron.openURL('gallery');
  }

  useEffect(() => {
    async function fetchBalances() {

      let target = environment === 'production' ? 'BTS' : 'BTS_TEST';
      window.electron.testConnections(target).then(async (res) => {
        let fastestNode = res.node;
        setNodes(res.latencies);

        if (environment === 'production') {
          setProdConnection(fastestNode);
        } else {
          setTestnetConnection(fastestNode);
          setCDKey('TESTNET');
          return;
        }

        try {
          await Apis.instance(fastestNode, true).init_promise;
        } catch (error) {
          console.log(error);
          changeURL();
          return;
        }
        
        let balanceResult;
        try {
          balanceResult = await Apis.instance().db_api().exec("get_account_balances", [userID, []]);
        } catch (error) {
          console.log(error);
          return;
        }
        
        let balanceSymbols;
        try {
          balanceSymbols = await Apis.instance().db_api().exec( "lookup_asset_symbols", [ balanceResult.map(balance => balance.asset_id) ]);
        } catch (error) {
          console.log(error);
          return;
        }

        let mergedResult = balanceResult.map((balance) => {
          let symbolData = balanceSymbols.find(symbol => symbol.id === balance.asset_id);
          symbolData.amount = balance.amount;
          symbolData.preciseAmount = balance.amount > 0 ? balance.amount / Math.pow(10, symbolData.precision) : 0
          return symbolData;
        })

        let filteredAssets = mergedResult.map((res) => {
          return {symbol: res.symbol.split('.')[0], amount: res.preciseAmount}
        }).filter((balance) => {
          if (accessPasses[balance.symbol] && balance.amount > accessPasses[balance.symbol]) {
            return true;
          } else {
            return false;
          }
        })

        if (filteredAssets.length) {
          let ownedCDKEY = filteredAssets[0];
          setCDKey(ownedCDKEY);
          console.log("Authorized to use application");
        } else {
          setBalances([]);
          console.log("You are not authorized to use this application.");
        }
      })
    }
    fetchBalances();
  }, [userID, setCDKey, tries]);
  
  let topText;
  if (!nodes) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="sm" weight={600}>
                    Finding the fastest node to connect to...
                </Text>
              </span>;
  } else if (!balances) {
    topText = <span>
                <Loader variant="dots" />
                <Text size="sm" weight={600}>
                    Checking your Bitshares account...
                </Text>
              </span>;
  } else {
    topText = <span>
                <Text size="sm" weight={600}>
                    Unfortunately, your Bitshares account cannot access this tool at this time.
                </Text>
                <Text size="sm" weight={600}>
                    Your account must either have 100,000 BTS or an NFTEA NFT in its portfolio to proceed.
                </Text>
                <Text size="sm" weight={600}>
                    Everyone is however entirely free to use this tool on the Bitshares testnet blockchain.
                </Text>
              </span>
  }

  let tryAgain;
  if (nodes && balances) {
    tryAgain = <span>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px'}}
                    onClick={() => {
                      openGallery()
                    }}
                  >
                    NFTEA NFTs
                  </Button>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px'}}
                    onClick={() => {
                      increaseTries()
                    }}
                  >
                    Check again
                  </Button>
                </span>;
  }

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        <Box mx="auto" sx={{padding: '10px'}}>
          {
            topText
          }
          {
            tryAgain
          }
          <Button
            sx={{marginTop: '15px'}}
            onClick={() => {
              back()
            }}
          >
            Back
          </Button>
        </Box>
      </Paper>
    </Col>
  );
}
