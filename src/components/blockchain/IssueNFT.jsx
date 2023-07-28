import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Group,
  Box,
  Text,
  SimpleGrid,
  Loader,
  Col,
  Paper,
  TextInput,
  Radio,
  Center,
  JsonInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';

import { appStore, beetStore, tempStore } from '../../lib/states';
import { broadcastOperation } from '../../lib/broadcasts';
import { generateDeepLink } from '../../lib/generate';

export default function IssueNFT(properties) {
  const { t, i18n } = useTranslation();

  const asset = tempStore((state) => state.asset);
  const accountType = tempStore((state) => state.accountType);

  const environment = appStore((state) => state.environment);
  const nodes = appStore((state) => state.nodes);
  const wsURL = nodes[environment][0];

  const connection = beetStore((state) => state.connection);

  const { userID } = properties;

  const [inProgress, setInProgress] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState();

  const [manualType, setManualType] = useState();
  const [localContents, setLocalContents] = useState();

  async function processForm(values) {
    setInProgress(true);
    const operation = {
      issuer: values.issuer,
      asset_to_issue: {
        amount: values.asset_to_issue_amount,
        asset_id: values.asset_to_issue_asset_id,
      },
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
      let generatedLocalContents;
      try {
        generatedLocalContents = await generateDeepLink(
          'nft_creator',
          environment === "bitshares" ? "BTS" : "BTS_TEST",
          wsURL,
          'asset_issue',
          [operation],
        );
      } catch (error) {
        console.log(error);
        setInProgress(false);
        return;
      }

      if (operation) {
        setLocalContents(generatedLocalContents);
        setInProgress(false);
      }
    }
  }

  const initialValues = {
    issuer: userID,
    asset_to_issue_amount: 1,
    asset_to_issue_asset_id: asset.id,
    issue_to_account: "1.2.x",
  };

  const form = useForm({
    initialValues,
    validate: {
      asset_to_issue_amount: (value) => (value > 0 ? null : t('blockchain:issueNFT.form.invalid')),
      asset_to_issue_asset_id: (value) => (value.length > 0 ? null : t('blockchain:issueNFT.form.invalid')),
      issue_to_account: (value) => (value.length > 0 && value.includes("1.2.") ? null : t('blockchain:issueNFT.form.invalid')),
    },
    validateInputOnChange: true,
  });

  const re = /^\d*(\.\d+)?$/;

  return (
    <Col span={12}>
      <Paper padding="sm" shadow="xs">
        {
          inProgress
            ? (
              <span>
                <Text size="md">
                  {t('blockchain:issueNFT.form.progress')}
                </Text>
                <Text size="md">
                  {t('blockchain:issueNFT.form.beetWait')}
                </Text>
                <Loader variant="dots" />
              </span>
            )
            : null
        }
        {
          broadcastResult
            ? (
              <Col span={12} key="Top">
                <Paper sx={{ padding: '5px' }} shadow="xs">
                  <Text size="md">
                    {t(
                      'blockchain:issueNFT.form.success',
                      { network: environment === 'bitshares' ? 'Bitshares' : 'Bitshares (Testnet)' },
                    )}
                  </Text>
                </Paper>
              </Col>
            )
            : null
        }
        {
          localContents
            ? (
              <Col span={12} key="Top">
                <Text>{t('blockchain:wizard.choice')}</Text>
                <Center mt="sm">
                  <Radio.Group
                    value={manualType}
                    onChange={setManualType}
                    name="manualTypeRadioGroup"
                    withAsterisk
                  >
                    <Group>
                      <Radio value="LOCAL" label="Local file" />
                      <Radio value="JSON" label="JSON data" />
                    </Group>
                  </Radio.Group>
                </Center>
              </Col>
            )
            : null
        }
        {
          localContents && manualType && manualType === "JSON"
            ? (
              <JsonInput
                placeholder="Textarea will autosize to fit the content"
                defaultValue={decodeURIComponent(localContents)}
                validationError="Invalid JSON"
                formatOnBlur
                autosize
                minRows={4}
                maxRows={15}
              />
            )
            : null
        }
        {
          localContents && manualType && manualType === "LOCAL"
            ? (
              <Paper>
                <Text>{t("blockchain:wizard.confirmation")}</Text>
                <Text fz="xs">
                  {t("blockchain:wizard.download1")}
                  <br />
                  {t("blockchain:wizard.download2")}
                  <br />
                  {t("blockchain:wizard.download3")}
                </Text>

                <a
                  href={`data:text/json;charset=utf-8,${localContents}`}
                  download="NFT.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button mt="md" mb="md">
                    {t("blockchain:wizard.downloadButton")}
                  </Button>
                </a>
              </Paper>
            )
            : null
        }
        {
          !inProgress && !broadcastResult && !localContents
            ? (
              <Box mx="auto" sx={{ padding: '10px' }}>
                <Col span={12} key="Top">
                  <Paper sx={{ padding: '5px' }} shadow="xs">
                    <Text size="lg">
                      {t('blockchain:issueNFT.form.issueHeader')}
                    </Text>
                    <Text size="md">
                      {t('blockchain:issueNFT.form.readyHeader')}
                    </Text>
                    <Text size="sm">
                      {t('blockchain:issueNFT.form.subHeader')}
                    </Text>
                  </Paper>
                </Col>
                <SimpleGrid cols={2}>
                  <Col span={6} key="Asset Details">
                    <Paper sx={{ padding: '5px', textAlign: 'left' }} shadow="xs">
                      <TextInput
                        required
                        disabled
                        label={t('blockchain:issueNFT.form.issuerLabel')}
                        placeholder="1.2.x"
                        {...form.getInputProps('issuer')}
                      />
                      <TextInput
                        required
                        disabled
                        label={t('blockchain:issueNFT.form.assetID')}
                        placeholder="1.3.x"
                        {...form.getInputProps('asset_to_issue_asset_id')}
                      />
                    </Paper>
                  </Col>
                  <Col span={6} key="SubmitBox">
                    <Paper sx={{ padding: '5px' }} shadow="xs">
                      <span style={{textAlign: 'left'}}>
                        <TextInput
                          required
                          label={t('blockchain:issueNFT.form.quantity')}
                          placeholder="1"
                          {...form.getInputProps('asset_to_issue_amount')}
                        />
                        <TextInput
                          required
                          label={t('blockchain:issueNFT.form.target')}
                          placeholder="1.2.x"
                          {...form.getInputProps('issue_to_account')}
                        />
                      </span>
                      <Text color="red" size="md">
                        {t('blockchain:issueNFT.form.completeHeader')}
                      </Text>
                      <form
                        onSubmit={
                          form.onSubmit((values) => processForm(values))
                        }
                      >
                        {
                          form.values.asset_to_issue_amount
                          && form.values.asset_to_issue_amount > 0
                          && form.values.issue_to_account
                          && form.values.issue_to_account.length > 4
                          && form.values.issue_to_account.slice(0, 4) === "1.2."
                          && (form.values.issue_to_account.split("1.2.")[1]).match(re)
                            ? (
                              <Button mt="sm" compact type="submit">
                                {t('blockchain:issueNFT.form.completeBtn')}
                              </Button>
                            )
                            : (
                              <Button mt="sm" compact disabled>
                                {t('blockchain:issueNFT.form.completeBtn')}
                              </Button>
                            )
                        }
                      </form>
                    </Paper>
                  </Col>
                </SimpleGrid>

              </Box>
            )
            : null
        }
      </Paper>
      <Link style={{ textDecoration: 'none' }} to="/">
        <Button
          mt="sm"
          compact
          variant="light"
        >
          {t('blockchain:issueNFT.form.back')}
        </Button>
      </Link>
    </Col>
  );
}
