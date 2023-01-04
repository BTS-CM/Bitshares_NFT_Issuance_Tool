import React, { useEffect, useState } from 'react';
import {
  Button, Group, Box, Text, Divider, SimpleGrid, Loader, Col, Paper, TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { QRCode } from 'react-qrcode-logo';

import { appStore, beetStore } from '../../lib/states';
import { generateObject, broadcastOperation } from '../../lib/broadcasts';

export default function SelectAsset(properties) {
  const back = appStore((state) => state.back);
  
  const asset = appStore((state) => state.asset);
  const wsURL = appStore((state) => state.nodes[0]);
  const accountType = appStore((state) => state.accountType);
  const environment = appStore((state) => state.environment);

  const connection = beetStore((state) => state.connection);

  const { userID } = properties;

  const [inProgress, setInProgress] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState();
  const [qrContents, setQRContents] = useState();

  async function processForm(values) {
    setInProgress(true);
    const operation = {
      issuer: values.issuer,
      asset_to_issue: {
        amount: values.asset_to_issue_amount,
        asset_id: values.asset_to_issue_asset_id,
      },
      //memo: undefined,
      //memo: values.memo,
      issue_to_account: values.issue_to_account,
      extensions: [],
    };

    if (accountType === 'BEET') {
      let tx;
      try {
        tx = await broadcastOperation(connection, wsURL, 'asset_issue', operation);
      } catch (error) {
        console.log(error);
        setInProgress(false);
        return;
      }

      setBroadcastResult(tx);
      setInProgress(false);
    } else {
      let generatedObj;
      try {
        generatedObj = await generateObject('asset_issue', operation);
      } catch (error) {
        console.log(error);
        setInProgress(false);
        return;
      }

      if (operation) {
        setQRContents(generatedObj);
        setInProgress(false);
      }
    }
  }

  function goBack() {
    back();
  }

  /*
    <TextInput
      label="Optional memo text"
      placeholder=""
      {...form.getInputProps('memo')}
    />
  */

  const initialValues = {
    issuer: userID,
    asset_to_issue_amount: 1,
    asset_to_issue_asset_id: asset.id,
    //memo: "", // optional
    issue_to_account: "1.2.x",
  };

  const form = useForm({
    initialValues,
    validate: {
      asset_to_issue_amount: (value) => (value > 0 ? null : 'Invalid'),
      asset_to_issue_asset_id: (value) => (value.length > 0 ? null : 'Invalid'),
      issue_to_account: (value) => (value.length > 0 && value.includes("1.2.") ? null : 'Invalid'),
    },
    validateInputOnChange: true,
  });

  let response = null;
  if (qrContents) {
    response = (
      <span>
        <Text size="md" sx="margin-bottom:15px;">
          To issue this NFT, open the Beet wallet and scan the below QR code.
        </Text>
        <QRCode
          value={JSON.stringify(qrContents)}
          ecLevel="H"
          size={420}
          quietZone={25}
          qrStyle="dots"
        />
        <br />
        <Button
          variant="light"
          onClick={() => {
            goBack();
          }}
        >
          Back
        </Button>
      </span>
    );
  } else if (inProgress) {
    response = (
      <span>
        <Text size="md">Please wait...</Text>
        <Loader variant="dots" />
      </span>
    );
  } else if (broadcastResult) {
    response = (
      <Col span={12} key="Top">
        <Paper sx={{ padding: '5px' }} shadow="xs">
          <Text size="md">
            Successfully issued your NFT on the
            {' '}
            {environment === 'production' ? 'Bitshares' : 'Bitshares (Testnet)'}
            {' '}
            blockchain!
          </Text>
          <Button
            onClick={() => {
              goBack();
            }}
          >
            Go back
          </Button>
        </Paper>
      </Col>
    );
  } else {
    // Showing the user the form

    response = (
      <Box mx="auto" sx={{ padding: '10px' }} >
        <Col span={12} key="Top">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Ready to issue NFTs on the Bitshares blockchain!</Text>
            <Text size="sm">Complete the below form to proceed with NFT issuance.</Text>
            <Button
              onClick={() => {
                goBack();
              }}
            >
              Go back
            </Button>
          </Paper>
        </Col>
        <Col span={12} key="Asset Details">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Asset issuance form</Text>
            <TextInput
              required
              disabled
              label="Bitshares account used for NFT issuance"
              placeholder="1.2.x"
              {...form.getInputProps('issuer')}
            />
            <TextInput
              required
              disabled
              label="NFT Asset ID"
              placeholder="1.3.x"
              {...form.getInputProps('asset_to_issue_asset_id')}
            />
            <TextInput
              required
              label="Quantity of NFT to issue"
              placeholder="1"
              {...form.getInputProps('asset_to_issue_amount')}
            />
            <TextInput
              required
              label="Target account to issue NFT to"
              placeholder="1.2.x"
              {...form.getInputProps('issue_to_account')}
            />
          </Paper>
        </Col>
        <Col span={12} key="SubmitBox">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            {!inProgress ? (
              <span>
                <Text color="red" size="md">
                  Complete the fields in the above form.
                </Text>
                <form
                  onSubmit={
                    form.onSubmit((values) => processForm(values))
                  }
                >
                  <Button mt="sm" compact type="submit">Submit</Button>
                </form>
              </span>
            ) : (
              <span>
                <Loader variant="dots" />
                <Text size="md">Waiting on responses from BEET prompts</Text>
              </span>
            )}
          </Paper>
        </Col>
      </Box>
    );
  }

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        { response }
      </Paper>
    </Col>
  );
}
