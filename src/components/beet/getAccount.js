import { useState, useEffect } from 'react';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
  Button,
  TextInput
} from '@mantine/core';

export default function GetAccount(properties) {
  let connection = properties.connection;
  let wsURL = properties.wsURL;

  async function getAccount() {
    let requestedAccount;
    try {
      requestedAccount = await connection.requestAccount();
    } catch (error) {
      return;
    }
    console.log(requestedAccount)
  }

  return (
    <Button
      sx={{marginTop: '15px'}}
      onClick={() => {
        getAccount()
      }}
    >
      Get account
    </Button>
  );
}
