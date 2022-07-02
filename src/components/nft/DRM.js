
import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider } from '@mantine/core';
import { Apis } from "bitsharesjs-ws";

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

export default function DRM(properties) {
  const setCDKey = properties.setCDKey;
  const userID = properties.userID;
  const [balances, setBalances] = useState();
  const [tries, setTries] = useState(0);
  
  function increaseTries() {
    let newTries = tries + 1;
    setBalances();
    setTries(newTries);
  }

  useEffect(() => {
    async function fetchBalances() {
      try {
        await Apis.instance("wss://node.xbts.io/ws", true).init_promise;
      } catch (error) {
        console.log(error);
        return;
      }
      
      let balanceResult;
      try {
        balanceResult = await Apis.instance().db_api().exec("get_account_balances", [userID, []]);
      } catch (error) {
        console.log(error);
        return;
      }
      
      let filteredResults = balanceResult.filter(balance => nftIDs.includes(balance.asset_id));
      if (filteredResults.length) {
        let ownedCDKEY = filteredResults[0];
        setCDKey(ownedCDKEY);
        console.log("Authorized to use application");
      } else {
        setBalances([]);
        console.log("You are not authorized to use this application.");
      }
    }
    fetchBalances();
  }, [userID, setCDKey, tries]);
  
  let topText = !balances
      ? <Text size="sm" weight={600}>
          Checking your Bitshares account balances...
        </Text>
      : <Text size="sm" weight={600}>
          To use this tool your Bitshares portfolio must include an NFT from the <a href="https://nftea.gallery/gallery">NFTEA Collection</a>.
        </Text>

  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      {
        topText
      }
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          increaseTries()
        }}
      >
        Try again
      </Button>
    </Box>
  );
}
