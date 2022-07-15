import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider } from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

/*
  let nfts = [
    {"name": "NFTEA.COPYB", "id": "1.3.6108"},
    {"name": "NFTEA.CHANCE", "id": "1.3.6107"},
    {"name": "NFTEA.CHANGE", "id": "1.3.6106"},
    {"name": "NFTEA.CONTROL", "id": "1.3.6105"},
    {"name": "NFTEA.CRIME", "id": "1.3.6104"},
    {"name": "NFTEA.CURRENT", "id": "1.3.6103"},
    {"name": "NFTEA.DAMAGE", "id": "1.3.6102"},
    {"name": "NFTEA.DESIGN", "id": "1.3.6101"},
    {"name": "NFTEA.DEV", "id": "1.3.6100"},
    {"name": "NFTEA.DIRECTION", "id": "1.3.6099"},
    {"name": "NFTEA.FIRE", "id": "1.3.6098"},
    {"name": "NFTEA.DETAIL", "id": "1.3.6092"},
    {"name": "NFTEA.DEATH", "id": "1.3.6091"},
    {"name": "NFTEA.AGREEMENT", "id": "1.3.6090"},
    {"name": "NFTEA.AIR", "id": "1.3.6089"},
    {"name": "NFTEA.AMOUNT", "id": "1.3.6088"},
    {"name": "NFTEA.APPROVAL", "id": "1.3.6087"},
    {"name": "NFTEA.ART", "id": "1.3.6086"},
    {"name": "NFTEA.ATTACKA", "id": "1.3.6085"},
    {"name": "NFTEA.ATTACKB", "id": "1.3.6084"},
    {"name": "NFTEA.ATTENTION", "id": "1.3.6083"},
    {"name": "NFTEA.ATTRACTION", "id": "1.3.6082"},
    {"name": "NFTEA.BALANCE", "id": "1.3.6081"},
    {"name": "NFTEA.BELIEF", "id": "1.3.6080"},
    {"name": "NFTEA.BIT", "id": "1.3.6079"},
    {"name": "NFTEA.BLOW", "id": "1.3.6078"},
    {"name": "NFTEA.HOME", "id": "1.3.6077"},
    {"name": "NFTEA.BURST", "id": "1.3.6076"},
    {"name": "NFTEA.CARE", "id": "1.3.6075"},
    {"name": "NFTEA.CAUSE", "id": "1.3.6074"},
    {"name": "NFTEA.COLOUR", "id": "1.3.6073"},
    {"name": "NFTEA.COMFORT", "id": "1.3.6072"},
    {"name": "NFTEA.COMPARISON", "id": "1.3.6071"},
    {"name": "NFTEA.COMPETE", "id": "1.3.6070"},
    {"name": "NFTEA.CONNECTION", "id": "1.3.6069"},
    {"name": "NFTEA.COPY", "id": "1.3.6068"},
    {"name": "NFTEA.CRACK", "id": "1.3.6067"},
    {"name": "NFTEA.CREDIT", "id": "1.3.6066"},
    {"name": "NFTEA.CRUSH", "id": "1.3.6065"},
    {"name": "NFTEA.DAY", "id": "1.3.6064"},
    {"name": "NFTEA.DISCOVERY", "id": "1.3.6063"},
    {"name": "NFTEA.F3", "id": "1.3.6027"},
    {"name": "BTS", "id": "1.3.0"}
  ];

  const nftIDs = nfts.map(nft => nft.id);
  const idNames = nfts.map(nft => {
    let temp = {};
    temp[nft.id] = nft.name;
    return temp
  });

  let filteredResults = balanceResult.filter(balance => nftIDs.includes(balance.asset_id));
  if (filteredResults.length) {
    let ownedCDKEY = filteredResults[0];
    setCDKey(ownedCDKEY);
    console.log("Authorized to use application");
  } else {
    setBalances([]);
    console.log("You are not authorized to use this application.");
  }
*/

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
    window.electron.openGallery('launch');
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
          fetchBalances();
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
        
        let filteredSymbols = balanceSymbols.map(balance => balance.symbol).filter(symbol => symbol.startsWith("NFTEA."));
        if (filteredSymbols.length) {
          let ownedCDKEY = filteredSymbols[0];
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
    topText = <Text size="sm" weight={600}>
                  Finding fastest BTS nodes
              </Text>;
  } else if (!balances) {
    topText = <Text size="sm" weight={600}>
                  Checking your Bitshares account balances...
              </Text>;
  } else {
    topText = <span>
                <Text size="sm" weight={600}>
                    This tool is reserved for owners of <a onClick={() => openGallery()}>NFTEA NFTs</a> on the production bitshares blockchain. If available, you can acquire them directly on the Bitshares DEX.
                </Text>
                <Text size="sm" weight={600}>
                    This tool is however available for all on the Bitshares testnet.
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
                    Try again
                  </Button>
                </span>;
  }

  return (
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
  );
}
