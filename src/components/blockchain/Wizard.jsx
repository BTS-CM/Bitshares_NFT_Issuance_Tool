import React, { useState } from 'react';
import {
  TextInput,
  Checkbox,
  Button,
  Modal,
  Text,
  Col,
  Paper,
  Group,
  Tooltip,
  ScrollArea,
  Container,
  Code,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { QRCode } from 'react-qrcode-logo';

import { appStore, beetStore, identitiesStore } from '../../lib/states';
import { getPermissions, getFlags, getFlagBooleans } from '../../lib/permissions';
import { generateObject, broadcastOperation } from '../../lib/broadcasts';

function openLink() {
  window.electron.openURL('nft_spec');
}

export default function Wizard(properties) {
  const { userID } = properties;

  const [broadcastResult, setBroadcastResult] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [qrContents, setQRContents] = useState();

  const [modalOpened, setModalOpened] = useState(false);
  const [modalContents, setModalContents] = useState('');

  const accountType = appStore((state) => state.accountType);

  const connection = beetStore((state) => state.connection);
  const asset = appStore((state) => state.asset);
  const asset_images = appStore((state) => state.asset_images);

  const initialFormValues = appStore((state) => state.initialValues);

  const back = appStore((state) => state.back);

  const environment = appStore((state) => state.environment);
  const mode = appStore((state) => state.mode);
  const wsURL = appStore((state) => state.nodes[0]);

  const setDrafts = identitiesStore((state) => state.setDrafts);
  const setChangingImages = appStore((state) => state.setChangingImages);

  /**
   * Generate booleans for the permissions
   * @param {Object} values
   * @returns {Object}
   */
  function generatePermissionBooleans(values) {
    return {
      charge_market_fee: values.perm_charge_market_fee,
      white_list: values.perm_white_list,
      override_authority: values.perm_override_authority,
      transfer_restricted: values.perm_transfer_restricted,
      disable_confidential: values.perm_disable_confidential,
    };
  }

  /**
   * Generate booleans for the flags
   * @param {Object} values
   * @returns {Object}
   */
  function generateFlagBooleans(values) {
    return {
      charge_market_fee: values.flag_charge_market_fee,
      white_list: values.flag_white_list,
      override_authority: values.flag_override_authority,
      transfer_restricted: values.flag_transfer_restricted,
      disable_confidential: values.flag_disable_confidential,
    };
  }

  /**
   * Generate the NFT object
   * @param {Object} values
   * @returns {Object}
   */
  function generateNFTObj(values) {
    const nft_object = {
      acknowledgements: values.acknowledgements,
      artist: values.artist,
      attestation: values.attestation,
      encoding: 'ipfs',
      holder_license: values.holder_license,
      license: values.license,
      narrative: values.narrative,
      title: values.title,
      tags: values.tags,
      type: values.type,
    };

    asset_images.forEach((image) => {
      // Supports png, jpeg & gif, following the NFT spec
      const imageType = image.type;
      if (!nft_object[`media_${imageType}_multihash`]) {
        // only the first image is used for the main image
        nft_object[`media_${imageType}_multihash`] = image.url;
      }
      if (!nft_object[`media_${imageType}_multihashes`]) {
        // initialise the ipfs multihashes array
        nft_object[`media_${imageType}_multihashes`] = [{
          url: image.url,
        }];
      } else {
        // add the image to the ipfs multihashes array
        nft_object[`media_${imageType}_multihashes`].push({
          url: image.url,
        });
      }
    });

    return nft_object;
  }

  function changeImages() {
    setChangingImages(true);
  }

  /**
   * Saving the NFT draft JSON to persistant local storage
   * @param {JSON} values
   */
  async function saveForm(values) {
    setDrafts(values, asset_images);
  }

  /**
   * Show the current NFT draft JSON in a modal
   * @param {Object} values
   */
  async function modalDisplay(values) {
    setModalOpened(true);
    console.log({
      values,
      asset_images,
    });
    setModalContents({
      values,
      asset_images,
    });
  }

  /**
     * Signing primary form values with memo key prior to broadcast
     * @param {Object} values
     */
  async function processForm(values) {
    setInProgress(true);
    const permissionBooleans = generatePermissionBooleans(values);
    const flagBooleans = generateFlagBooleans(values);
    const nft_object = generateNFTObj(values);
    const issuer_permissions = getPermissions(permissionBooleans, false);
    const flags = getFlags(flagBooleans);

    let signedPayload;
    if (accountType === 'BEET') {
      try {
        signedPayload = await connection.signNFT(nft_object);
      } catch (error) {
        console.log(error);
        setInProgress(false);
        return;
      }
    } else {
      signedPayload = {
        signed: values.signed ?? '',
        signature: values.signature ?? '',
      };
    }

    if (signedPayload) {
      const description = JSON.stringify({
        main: values.main,
        market: values.market,
        nft_object: signedPayload.signed,
        nft_signature: signedPayload.signature,
        short_name: values.short_name,
      });

      const operation = mode === 'create'
        ? {
          // create asset json
          issuer: userID,
          symbol: values.symbol,
          precision: values.precision,
          common_options: {
            max_supply: values.max_supply,
            market_fee_percent: 0,
            max_market_fee: 0,
            issuer_permissions,
            flags,
            core_exchange_rate: {
              base: {
                amount: values.cer_base_amount,
                asset_id: values.cer_base_asset_id,
              },
              quote: {
                amount: values.cer_quote_amount,
                asset_id: values.cer_quote_asset_id,
              },
            },
            whitelist_authorities: [],
            blacklist_authorities: [],
            whitelist_markets: [],
            blacklist_markets: [],
            description,
            extensions: {
              reward_percent: 0,
              whitelist_market_fee_sharing: [],
            },
          },
          is_prediction_market: false,
          extensions: null,
        }
        : {
          // edit asset json
          issuer: userID,
          asset_to_update: asset.id,
          new_options: {
            max_supply: parseInt(values.max_supply, 10),
            market_fee_percent: 0,
            max_market_fee: 0,
            issuer_permissions,
            flags,
            core_exchange_rate: {
              base: {
                amount: parseInt(values.cer_base_amount, 10),
                asset_id: values.cer_base_asset_id,
              },
              quote: {
                amount: parseInt(values.cer_quote_amount, 10),
                asset_id: values.cer_quote_asset_id,
              },
            },
            whitelist_authorities: [],
            blacklist_authorities: [],
            whitelist_markets: [],
            blacklist_markets: [],
            description,
            extensions: {
              reward_percent: 0,
              whitelist_market_fee_sharing: [],
            },
          },
          is_prediction_market: false,
          extensions: null,
        };

      if (accountType === 'BEET') {
        let tx;
        try {
          tx = await broadcastOperation(
            connection,
            wsURL,
            mode === 'create' ? 'asset_create' : 'asset_update',
            operation,
          );
        } catch (error) {
          console.log(error);
          setInProgress(false);
          return;
        }

        setBroadcastResult(tx);
      } else {
        let generatedObj;
        try {
          generatedObj = await generateObject(
            mode === 'create'
              ? 'asset_create'
              : 'asset_update',
            operation,
          );
        } catch (error) {
          console.log(error);
          setInProgress(false);
          return;
        }

        if (operation) {
          setQRContents(generatedObj);
        }
      }

      console.log(operation);
      setInProgress(false);
    } else {
      console.log('An issue with signing the nft_object occurred');
      setInProgress(false);
    }
  }

  const options = asset && asset.options ? asset.options : null;
  const description = options ? JSON.parse(options.description) : null;
  const nft_object = description ? description.nft_object : null;

  let permissionBooleans;
  if (options) {
    permissionBooleans = getFlagBooleans(options.issuer_permissions, false);
  } else if (initialFormValues) {
    permissionBooleans = generatePermissionBooleans(initialFormValues);
  } else {
    permissionBooleans = {
      charge_market_fee: true,
      white_list: true,
      override_authority: true,
      transfer_restricted: true,
      disable_confidential: true,
    };
  }

  let flagBooleans;
  if (options) {
    flagBooleans = getFlagBooleans(options.flags, false);
  } else if (initialFormValues) {
    flagBooleans = generateFlagBooleans(initialFormValues);
  } else {
    flagBooleans = {
      charge_market_fee: false,
      white_list: false,
      override_authority: false,
      transfer_restricted: false,
      disable_confidential: false,
    };
  }

  const initialValues = initialFormValues || {
    acknowledgements: nft_object ? nft_object.acknowledgements : '',
    artist: nft_object ? nft_object.artist : '',
    attestation: nft_object ? nft_object.attestation : '',
    holder_license: nft_object ? nft_object.holder_license : '',
    license: nft_object ? nft_object.license : '',
    narrative: nft_object ? nft_object.narrative : '',
    title: nft_object ? nft_object.title : '',
    tags: nft_object ? nft_object.tags : '',
    type: nft_object ? nft_object.type : 'NFT/ART/VISUAL',
    main: description ? description.main : '',
    //
    market: description ? description.market : 'BTS',
    short_name: description ? description.short_name : '',
    symbol: asset ? asset.symbol : '', // check
    precision: asset ? asset.precision : 0,
    max_supply: options ? options.max_supply : 1,

    // core_exchange_rate
    cer_base_amount: options ? options.core_exchange_rate.base.amount : 1,
    cer_base_asset_id: options ? options.core_exchange_rate.base.asset_id : '1.3.0',
    cer_quote_amount: options ? options.core_exchange_rate.quote.amount : 1,
    cer_quote_asset_id: options ? options.core_exchange_rate.quote.asset_id : '1.3.1',

    // permissions
    perm_charge_market_fee: permissionBooleans.charge_market_fee,
    perm_white_list: permissionBooleans.white_list,
    perm_override_authority: permissionBooleans.override_authority,
    perm_transfer_restricted: permissionBooleans.transfer_restricted,
    perm_disable_confidential: permissionBooleans.disable_confidential,

    // flags
    flag_charge_market_fee: flagBooleans.charge_market_fee,
    flag_white_list: flagBooleans.white_list,
    flag_override_authority: flagBooleans.override_authority,
    flag_transfer_restricted: flagBooleans.transfer_restricted,
    flag_disable_confidential: flagBooleans.disable_confidential,

    // operationsJSON
    issuer: userID,
  };

  if (!accountType === 'BEET') {
    // User must manually sign some content
    initialValues.signed = '';
    initialValues.signature = '';
  }

  const form = useForm({
    initialValues,
    validate: {
      artist: (value) => (value.length > 0 ? null : 'Invalid'),
      attestation: (value) => (value.length > 0 ? null : 'Invalid'),
      title: (value) => (value.length > 0 ? null : 'Invalid'),
      main: (value) => (value.length > 0 ? null : 'Invalid'),
      market: (value) => (value.length > 0 ? null : 'Invalid'),
      short_name: (value) => (value.length > 0 ? null : 'Invalid'),
      symbol: (value) => (value.length > 0 ? null : 'Invalid'),
      max_supply: (value) => (value >= 0 ? null : 'Invalid'),
      precision: (value) => (value >= 0 ? null : 'Invalid'),
      flag_charge_market_fee: (value, values) => (value === true && !values.perm_charge_market_fee ? 'Invalid' : null),
      flag_white_list: (value, values) => (value === true && !values.perm_white_list ? 'Invalid' : null),
      flag_override_authority: (value, values) => (value === true && !values.perm_override_authority ? 'Invalid' : null),
      flag_transfer_restricted: (value, values) => (value === true && !values.perm_transfer_restricted ? 'Invalid' : null),
      flag_disable_confidential: (value, values) => (value === true && !values.perm_disable_confidential ? 'Invalid' : null),
    },
    validateInputOnChange: true,
  });

  let response;
  if (qrContents) {
    response = (
      <span>
        <Text size="md" sx="margin-bottom:15px;">
          To
          {' '}
          {mode}
          {' '}
          this NFT, open your Bitshares wallet and scan the below QR code.
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
            back();
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
  } else if (!broadcastResult && !qrContents) {
    response = (
      <span>
        <Col span={12} key="Top">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Ready to issue NFTs on the Bitshares blockchain!</Text>
            <Text size="sm">
              Make sure you have enough Bitshares tokens to cover the network fees.
            </Text>
            <Text size="sm">To save on fees consider getting a Bitshares lifetime membership.</Text>
            <Text size="sm">Also remember to withdraw the NFT&apos;s fee pool after creation.</Text>
            <Button
              sx={{ margin: '5px' }}
              onClick={() => {
                openLink();
              }}
            >
              BTS NFT Spec
            </Button>
            <Button
              onClick={() => {
                back();
              }}
            >
              Go back
            </Button>
          </Paper>
        </Col>
        <Col span={12} key="ImageDetails">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Image details</Text>
            <Text size="sm">
              This NFT currently contains the following
              {' '}
              {asset_images && asset_images.length}
              {' '}
              images:
            </Text>
            {asset_images
              ? asset_images.map((item) => (
                <Group key={item.url} sx={{ margin: '5px' }}>
                  <Text size="sm">
                    {`${item.url} (${(item.type)})`}
                  </Text>
                </Group>
              ))
              : null}
            <Button
              onClick={() => {
                changeImages();
              }}
            >
              Change images
            </Button>
          </Paper>
        </Col>
        <Col span={12} key="Asset Details">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Asset details</Text>
            <TextInput
              required
              disabled
              label="Bitshares account used for NFT issuance"
              placeholder="1.2.x"
              {...form.getInputProps('issuer')}
            />
            <TextInput
              required
              label="Asset symbol"
              placeholder="Asset symbol for DEX navigation"
              {...form.getInputProps('symbol')}
            />
            <TextInput
              required
              label="Main description"
              placeholder="Brief asset summary for DEX"
              {...form.getInputProps('main')}
            />
            <TextInput
              required
              label="Short name"
              placeholder="Shortened name for DEX"
              {...form.getInputProps('short_name')}
            />
            <TextInput
              required
              label="Market"
              placeholder="Primary trading asset e.g. BTS"
              {...form.getInputProps('market')}
            />
            <TextInput
              required
              label="Maximum supply"
              placeholder="1"
              {...form.getInputProps('max_supply')}
            />
            <TextInput
              required
              label="Asset precision (decimal places)"
              placeholder="1"
              {...form.getInputProps('precision')}
            />
          </Paper>
        </Col>
        <Col span={12} key="NFT Details">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">NFT details</Text>
            <TextInput
              required
              label="NFT title"
              placeholder="NFT title"
              {...form.getInputProps('title')}
            />
            <TextInput
              required
              label="NFT artist"
              placeholder="Artist identity, username or pseudonym"
              {...form.getInputProps('artist')}
            />
            <TextInput
              required
              label="NFT narrative"
              placeholder="Narrative"
              {...form.getInputProps('narrative')}
            />
            <TextInput
              required
              label="NFT tags"
              placeholder="comma,separated,tags"
              {...form.getInputProps('tags')}
            />
            <TextInput
              required
              label="NFT type"
              placeholder="NFT/ART/VISUAL"
              {...form.getInputProps('type')}
            />
            <TextInput
              required
              label="NFT attestation"
              placeholder="An attestation regarding this NFT"
              {...form.getInputProps('attestation')}
            />
            <TextInput
              required
              label="NFT acknowledgements"
              placeholder="Any acknowledgements you have to make"
              {...form.getInputProps('acknowledgements')}
            />
            <TextInput
              required
              label="NFT holders license"
              placeholder="NFT holder license"
              {...form.getInputProps('holder_license')}
            />
            <TextInput
              required
              label="NFT license"
              placeholder="License"
              {...form.getInputProps('license')}
            />
            <Text size="md">NFT Signatures</Text>
            {accountType !== 'BEET' ? (
              <TextInput
                label="Signed text"
                placeholder="signed"
                {...form.getInputProps('signed')}
              />
            ) : null}
            {accountType !== 'BEET' ? (
              <TextInput
                label="Signature"
                placeholder="signature"
                {...form.getInputProps('signature')}
              />
            ) : null}
          </Paper>
        </Col>
        <Col span={12} key="CER">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Core Exchange Rate</Text>
            <TextInput
              required
              label="Base amount"
              placeholder="0"
              {...form.getInputProps('cer_base_amount')}
            />
            <TextInput
              required
              label="base_asset_id"
              placeholder="cer_base_asset_id"
              {...form.getInputProps('cer_base_asset_id')}
            />
            <TextInput
              required
              label="quote_amount"
              placeholder="cer_quote_amount"
              {...form.getInputProps('cer_quote_amount')}
            />
            <TextInput
              required
              label="quote_asset_id"
              placeholder="cer_quote_asset_id"
              {...form.getInputProps('cer_quote_asset_id')}
            />
          </Paper>
        </Col>
        <Col span={12} key="Perms">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Permissions</Text>
            <Text size="sm">Note: Disabling permissions is a permanent decision.</Text>
            {!permissionBooleans.charge_market_fee ? (
              <Tooltip
                label="The charge_market_fee permission was permanently disabled."
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label="Enable market fee (charge_market_fee)"
                  {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Enable market fee (charge_market_fee)"
                {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.white_list ? (
              <Tooltip
                label="The white_list permission was permanently disabled."
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label="Require holders to be white-listed (white_list)"
                  {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Require holders to be white-listed (white_list)"
                {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.override_authority ? (
              <Tooltip
                label="The override_authority permission was permanently disabled."
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label="Asset owner may transfer asset back to himself (override_authority)"
                  {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Asset owner may transfer asset back to himself (override_authority)"
                {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.transfer_restricted ? (
              <Tooltip
                label="The transfer_restricted permission was permanently disabled."
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label="Asset owner must approve all transfers (transfer_restricted)"
                  {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Asset owner must approve all transfers (transfer_restricted)"
                {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.disable_confidential ? (
              <Tooltip
                label="The disable_confidential permission was permanently disabled."
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label="Disable confidential transactions (disable_confidential)"
                  {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Disable confidential transactions (disable_confidential)"
                {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
              />
            )}
          </Paper>
        </Col>
        <Col span={12} key="Flags">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Flags</Text>
            <Text size="sm">
              If a related permission above is enabled, these flags can be changed at any time.
            </Text>
            {
              !permissionBooleans.charge_market_fee
                ? ( // || form.values.perm_charge_market_fee === false
                  <Tooltip label="Relavent permission was disabled." color="gray" withArrow>
                    <Checkbox
                      mt="md"
                      disabled
                      label="Enable charging a market fee (charge_market_fee)"
                      {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                    />
                  </Tooltip>
                ) : (
                  <Checkbox
                    mt="md"
                    label="Enable charging a market fee (charge_market_fee)"
                    {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                  />
                )
}
            <br />
            {!permissionBooleans.white_list ? ( // || form.values.perm_white_list === false
              <Tooltip label="Relavent permission was disabled." color="gray" withArrow>
                <Checkbox
                  mt="md"
                  disabled
                  label="Require holders to be white-listed (white_list)"
                  {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label="Require holders to be white-listed (white_list)"
                {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
              />
            )}
            <br />
            {
            !permissionBooleans.override_authority
              ? ( // || form.values.perm_override_authority === false
                <Tooltip label="Relavent permission was disabled." color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label="Asset owner may transfer asset back to himself (override_authority)"
                    {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label="Asset owner may transfer asset back to himself (override_authority)"
                  {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                />
              )
}
            <br />
            {
            !permissionBooleans.transfer_restricted
              ? ( // || form.values.perm_transfer_restricted === false
                <Tooltip label="Relavent permission was disabled." color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label="Asset owner must approve all transfers (transfer_restricted)"
                    {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label="Asset owner must approve all transfers (transfer_restricted)"
                  {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                />
              )
}
            <br />
            {
            !permissionBooleans.disable_confidential
              ? ( // || form.values.perm_disable_confidential === false
                <Tooltip label="Relavent permission was disabled." color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label="Disable confidential transactions (disable_confidential)"
                    {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label="Disable confidential transactions (disable_confidential)"
                  {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
                />
              )
}
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
        <Col span={12} key="SaveBox">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <span>
              <Text size="sm">
                Save your progress for this NFT?
              </Text>
              <form
                onSubmit={
                      form.onSubmit((values) => saveForm(values))
                    }
              >
                {
                      form.values.symbol
                        ? <Button mt="sm" compact type="submit">Save Draft</Button>
                        : <Button mt="sm" compact disabled type="submit">Save Draft</Button>
                    }
              </form>
              <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title="NFT JSON"
              >
                <Container>
                  <ScrollArea p="md">
                    <Code block style={{ textAlign: 'left', maxWidth: '750px', wordBreak: 'break-all' }}>
                      {
                          modalOpened && modalContents
                            ? JSON.stringify(modalContents, undefined, 4)
                            : 'N/A'
                        }
                    </Code>
                  </ScrollArea>
                </Container>
              </Modal>
              <form
                onSubmit={
                      form.onSubmit((values) => {
                        setModalOpened(true);
                        modalDisplay(values);
                      })
                  }
              >
                {
                      form.values.symbol
                        ? (
                          <Button
                            mt="sm"
                            compact
                            type="submit"
                          >
                            View JSON
                          </Button>
                        )
                        : (
                          <Button
                            mt="sm"
                            compact
                            disabled
                            type="submit"
                          >
                            View JSON
                          </Button>
                        )
                    }
              </form>
            </span>
          </Paper>
        </Col>
      </span>
    );
  } else if (broadcastResult) {
    response = (
      <Col span={12} key="Top">
        <Paper sx={{ padding: '5px' }} shadow="xs">
          <Text size="md">
            Successfully
            {' '}
            {mode === 'create' ? 'created' : 'updated'}
            {' '}
            your NFT on the
            {' '}
            {environment === 'production' ? 'Bitshares' : 'BTS Testnet'}
            {' '}
            blockchain!
          </Text>
          <Button
            onClick={() => {
              back();
            }}
          >
            Go back
          </Button>
        </Paper>
      </Col>
    );
  }

  return (
    <Col span={12} key="Top">
      {response}
    </Col>
  );
}
