import { useState } from 'react';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
  Button,
  TextInput
} from '@mantine/core';

export default function Transfer(properties) {
  let connection = properties.connection;
  let wsURL = properties.wsURL;

  const [targetAccount, setTargetAccount] = useState("");
  const [amountInSatoshi, setAmountInSatoshi] = useState("");
  const [assetId, setAssetId] = useState("");

  const changeTargetAccount = async (event) => {
    setTargetAccount(event.target.value);
  };

  const changeAmountInSatoshi = async (event) => {
    setAmountInSatoshi(event.target.value);
  };

  const changeAssetId = async (event) => {
    setAssetId(event.target.value);
  };

  async function transfer() {
    let transaction;
    try {
      transaction = await connection.transfer({
          to: targetAccount,
          amount: {
            satoshis: amountInSatoshi,
            asset_id: assetId
          }
      })
    } catch (error) {
      console.log(error);
      return;
    }

    console.log(transaction);
  }

  return ([
      <TextInput
        key="targetAccount"
        label="targetAccount"
        value={targetAccount}
        onChange={changeTargetAccount}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="amountInSatoshi"
        label="amountInSatoshi"
        value={amountInSatoshi}
        onChange={changeAmountInSatoshi}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="assetId"
        label="assetId"
        value={assetId}
        onChange={changeAssetId}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          transfer()
        }}
      >
        Submit transfer
      </Button>
  ]);
}
