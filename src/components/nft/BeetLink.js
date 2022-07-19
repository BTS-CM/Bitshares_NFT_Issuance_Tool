import { useEffect, useState } from 'react';
import { Button, Group, Box, Text, Divider } from '@mantine/core';
import { link } from 'beet-js';

export default function BeetLink(properties) {
  const setIsLinked = properties.setIsLinked;
  const setIdentity = properties.setIdentity;
  const setCrypto = properties.setCrypto;
  const connection = properties.connection;

  /*
   * After connection attempt to link app to Beet client
   */
  async function _linkToBeet(target = "BTS") {
    if (!connection) {
      console.log("Missing Beet connection");
      return;
    }

    let linkAttempt;
    try {
      linkAttempt = await link(target, connection);
    } catch (error) {
      console.error(error)
      return;
    }

    if (!connection.identity) {
      console.log("Link rejected");
      return;
    }

    console.log('Successfully linked');
    setIsLinked(true);
    setIdentity(connection.identity);
    setCrypto(target)
  }
  
  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      <span>
        <Button
          sx={{marginTop: '15px', marginRight: '5px'}}
          onClick={() => {
            _linkToBeet('BTS')
          }}
        >
          Link to production Bitshares
        </Button>
        <Button
          sx={{marginTop: '15px'}}
          onClick={() => {
            _linkToBeet('BTS_TEST')
          }}
        >
          Link to testnet Bitshares
        </Button>
      </span>
    </Box>
  );
}
