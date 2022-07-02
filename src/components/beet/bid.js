import { useState, useEffect } from 'react';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
  Button,
  TextInput
} from '@mantine/core';

export default function Bid(properties) {
  let connection = properties.connection;
  let wsURL = properties.wsURL;

  const [sellerAccount, setSellerAccount] = useState("1.2.1808745");

  const [amountToSell, setAmountToSell] = useState(1);
  const [soldAsset, setSoldAsset] = useState("1.3.0");

  const [amountToBuy, setAmountToBuy] = useState(1);
  const [boughtAsset, setBoughtAsset] = useState("1.3.6073");

  const changeSellerAccount = async (event) => {
    setSellerAccount(event.target.value);
  };

  const changeAmountToSell = async (event) => {
    setAmountToSell(event.target.value);
  };

  const changeSoldAsset = async (event) => {
    setSoldAsset(event.target.value);
  };

  const changeAmountToBuy = async (event) => {
    setAmountToBuy(event.target.value);
  };

  const changeBoughtAsset = async (event) => {
    setBoughtAsset(event.target.value);
  };

  async function bid() {

    let TXBuilder = connection.inject(TransactionBuilder, {sign: true, broadcast: true});

    try {
      await Apis.instance(
          wsURL,
          true,
          10000,
          {enableCrypto: false, enableOrders: false},
          (error) => console.log(error),
      ).init_promise;
    } catch (error) {
      console.log(`api instance: ${error}`);
      return;
    }

    let tr = new TXBuilder();

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth(); // for example, 2021
    currentDate.setMonth(currentMonth + 1);

    tr.add_type_operation(
      "limit_order_create",
      {
          fee: {
              amount: 0,
              asset_id: "1.3.0"
          },
          seller: sellerAccount,
          amount_to_sell: {
            amount: amountToSell,
            asset_id: soldAsset
          },
          min_to_receive: {
            amount: amountToBuy,
            asset_id: boughtAsset
          },
          fill_or_kill: false,
          expiration: currentDate//"2023-01-09T09:30:00"
      }
    );

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.error(error);
      return;
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      return;
    }

    try {
      tr.add_signer("inject_wif");
    } catch (error) {
      console.error(error);
      return;
    }

    let result;
    try {
      result = await tr.broadcast();
    } catch (error) {
      console.error(error);
      return;
    }

    console.log(result);
  }

  return ([
      <TextInput
        key="sellerAccount"
        label="sellerAccount"
        value={sellerAccount}
        onChange={changeSellerAccount}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="amountToSell"
        label="amountToSell"
        value={amountToSell}
        onChange={changeAmountToSell}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="soldAsset"
        label="soldAsset"
        value={soldAsset}
        onChange={changeSoldAsset}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="amountToBuy"
        label="amountToBuy"
        value={amountToBuy}
        onChange={changeAmountToBuy}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <TextInput
        key="boughtAsset"
        label="boughtAsset"
        value={boughtAsset}
        onChange={changeBoughtAsset}
        sx={{marginBottom: '5px', marginTop: '5px'}}
      />,
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          bid()
        }}
      >
        Submit offer
      </Button>
  ]);
}
