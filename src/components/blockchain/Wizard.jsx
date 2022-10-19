import { useState } from 'react';
import { TextInput, Checkbox, Button, Box, Text, Divider, Col, Paper, Group, Tooltip, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { QRCode } from 'react-qrcode-logo';

import { appStore, beetStore } from '../../lib/states';
import { getPermissions, getFlags, getFlagBooleans } from '../../lib/permissions';
import { generateObject, broadcastOperation } from '../../lib/broadcasts';

function openLink() {
  window.electron.openURL('nft_spec');
}

export default function Wizard(properties) {
  const userID = properties.userID;
  
  const [broadcastResult, setBroadcastResult] = useState();
  const [inProgress, setInProgress] = useState(false);
  const [qrContents, setQRContents] = useState();

  let accountType = appStore((state) => state.accountType);

  let connection = beetStore((state) => state.connection);
  let asset = appStore((state) => state.asset);
  let asset_images = appStore((state) => state.asset_images);
  let back = appStore((state) => state.back);

  let environment = appStore((state) => state.environment);
  let mode = appStore((state) => state.mode);
  let wsURL = appStore((state) => state.nodes[0]);

  let setChangingImages = appStore((state) => state.setChangingImages);

  function changeImages() {
    setChangingImages(true);
  }

  /**
   * Signing primary form values with memo key prior to broadcast
   * @param {Object} values 
   */
  async function processForm(values) {
    setInProgress(true);
    let permissionBooleans = {
      "charge_market_fee": values.perm_charge_market_fee,
      "white_list": values.perm_white_list,
      "override_authority": values.perm_override_authority,
      "transfer_restricted": values.perm_transfer_restricted,
      "disable_confidential": values.perm_disable_confidential
    };

    let flagBooleans = {
      "charge_market_fee": values.flag_charge_market_fee,
      "white_list": values.flag_white_list,
      "override_authority": values.flag_override_authority,
      "transfer_restricted": values.flag_transfer_restricted,
      "disable_confidential": values.flag_disable_confidential
    };
    
    const imageType = asset_images[0].type;

    let nft_object = {
        acknowledgements: values.acknowledgements,
        artist: values.artist,
        attestation: values.attestation,
        encoding: 'ipfs',
        holder_license: values.holder_license,
        license: values.license,
        narrative: values.narrative,
        title: values.title,
        tags: values.tags,
        type: values.type
    };

    nft_object[`media_${imageType}_multihash`] = asset_images[0].url;
    nft_object[`media_${imageType}_multihashes`] = asset_images.map(image => {
      return {url: image.url}
    });

    let issuer_permissions = getPermissions(permissionBooleans, false);
    let flags = getFlags(flagBooleans);

    let signedPayload;
    if (accountType === "BEET") {
      try {
        signedPayload = await connection.signNFT(nft_object);
      } catch (error) {
        console.log(error);
        setInProgress(false);
        return;
      }
    } else {
      signedPayload = {
        signed: values.signed ?? "",
        signature: values.signature ?? ""
      }
    }
    
    if (signedPayload) {
      let description = JSON.stringify({
        main: values.main,
        market: values.market,
        nft_object: signedPayload.signed,
        nft_signature: signedPayload.signature,
        short_name: values.short_name
      });

      let operation = mode === 'create'
                      ? { // create asset json
                          issuer: userID,
                          symbol: values.symbol,
                          precision: values.precision,
                          common_options: {
                              max_supply: values.max_supply,
                              market_fee_percent: 0,
                              max_market_fee: 0,
                              issuer_permissions: issuer_permissions,
                              flags: flags,
                              core_exchange_rate: {
                                  base: {
                                      amount: values.cer_base_amount,
                                      asset_id: values.cer_base_asset_id
                                  },
                                  quote: {
                                      amount: values.cer_quote_amount,
                                      asset_id: values.cer_quote_asset_id
                                  }
                              },
                              whitelist_authorities: [],
                              blacklist_authorities: [],
                              whitelist_markets: [],
                              blacklist_markets: [],
                              description: description,
                              extensions: {
                                reward_percent: 0,
                                whitelist_market_fee_sharing: []
                              }
                          },
                          is_prediction_market: false,
                          extensions: null
                        }
                      : { // edit asset json
                        issuer: userID,
                        asset_to_update: asset.id,
                        new_options: {
                            max_supply: parseInt(values.max_supply),
                            market_fee_percent: 0,
                            max_market_fee: 0,
                            issuer_permissions: issuer_permissions,
                            flags: flags,
                            core_exchange_rate: {
                                base: {
                                    amount: parseInt(values.cer_base_amount),
                                    asset_id: values.cer_base_asset_id
                                },
                                quote: {
                                    amount: parseInt(values.cer_quote_amount),
                                    asset_id: values.cer_quote_asset_id
                                }
                            },
                            whitelist_authorities: [],
                            blacklist_authorities: [],
                            whitelist_markets: [],
                            blacklist_markets: [],
                            description: description,
                            extensions: {
                              reward_percent: 0,
                              whitelist_market_fee_sharing: []
                            }
                        },
                        is_prediction_market: false,
                        extensions: null
                      };

      if (accountType === "BEET") {
        let tx;
        try {
          tx = await broadcastOperation(connection, wsURL, mode, operation);
        } catch (error) {
          console.log(error);
          setInProgress(false);
          return;
        }
  
        setBroadcastResult(tx);
      } else {
        let generatedObj;
        try {
          generatedObj = await generateObject(mode, operation)
        } catch (error) {
          console.log(error);
          setInProgress(false);
          return;
        }

        if (operation) {
          setQRContents(generatedObj);
        }
      }

      console.log(operation)
      setInProgress(false);
    } else {
      console.log("An issue with signing the nft_object occurred");
      setInProgress(false);
      return;
    }
  }

  let options = asset && asset.options ? asset.options : null;
  let description = options ? JSON.parse(options.description) : null;
  let nft_object = description ? description.nft_object : null;

  let permissionBooleans = options
                            ? getFlagBooleans(options.issuer_permissions, false)
                            : {
                                "charge_market_fee": true,
                                "white_list": true,
                                "override_authority": true,
                                "transfer_restricted": true,
                                "disable_confidential": true
                              };

  let flagBooleans = options
                      ? getFlagBooleans(options.flags, false)
                      : {
                          "charge_market_fee": false,
                          "white_list": false,
                          "override_authority": false,
                          "transfer_restricted": false,
                          "disable_confidential": false
                        };

  let initialValues = {
      acknowledgements: nft_object ? nft_object.acknowledgements : '',
      artist:  nft_object ? nft_object.artist : '',
      attestation:  nft_object ? nft_object.attestation : '',
      holder_license:  nft_object ? nft_object.holder_license : '',
      license:  nft_object ? nft_object.license : '',
      narrative:  nft_object ? nft_object.narrative : '',
      title:  nft_object ? nft_object.title : '',
      tags:  nft_object ? nft_object.tags : '',
      type:  nft_object ? nft_object.type : 'NFT/ART/VISUAL',
      main:  description ? description.main : '',
      //
      market:  description ? description.market : 'BTS',
      short_name:  description ? description.short_name : '',
      symbol:  asset ? asset.symbol : '', // check
      precision: asset ? asset.precision : 0,
      max_supply: options ? options.max_supply : 1,

      // core_exchange_rate
      cer_base_amount: options ? options.core_exchange_rate.base.amount : 1,
      cer_base_asset_id: options ? options.core_exchange_rate.base.asset_id : "1.3.0",
      cer_quote_amount: options ? options.core_exchange_rate.quote.amount : 1,
      cer_quote_asset_id: options ? options.core_exchange_rate.quote.asset_id : "1.3.1",
      
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
      issuer: userID
  };

  if (!accountType === "BEET") {
    // User must manually sign some content
    initialValues.signed = "";
    initialValues.signature = "";
  }

  const form = useForm({
    initialValues: initialValues,
    validate: {
        artist: (value) => (value.length > 0 ? null : 'Invalid'),
        attestation: (value) => (value.length > 0 ? null : 'Invalid'),
        title: (value) => (value.length > 0  ? null : 'Invalid'),
        main: (value) => (value.length > 0  ? null : 'Invalid'),
        market: (value) => (value.length > 0  ? null : 'Invalid'),
        short_name: (value) => (value.length > 0  ? null : 'Invalid'),
        symbol: (value) => (value.length > 0  ? null : 'Invalid'),
        max_supply: (value) => (value >= 0 ? null : 'Invalid'),
        precision: (value) => (value >= 0 ? null : 'Invalid'),
        flag_charge_market_fee: (value, values) => (value === true && !values.perm_charge_market_fee ? 'Invalid' : null),
        flag_white_list: (value, values) => (value === true && !values.perm_white_list ? 'Invalid' : null),
        flag_override_authority: (value, values) => (value === true && !values.perm_override_authority ? 'Invalid' : null),
        flag_transfer_restricted: (value, values) => (value === true && !values.perm_transfer_restricted ? 'Invalid' : null),
        flag_disable_confidential: (value, values) => (value === true && !values.perm_disable_confidential ? 'Invalid' : null)
    },
    validateInputOnChange: true
  });

  let response;
  if (qrContents) {
    response = <span>
                <Text size="md" sx="margin-bottom:15px;">
                  To {mode} this NFT, open your Bitshares wallet and scan the below QR code.
                </Text>
                <QRCode
                  value={JSON.stringify(qrContents)}
                  ecLevel={"H"}
                  size={420}
                  quietZone={25}
                  qrStyle={"dots"}
                />
                <br/>
                <Button
                  variant="light"
                  onClick={() => {
                    back()
                  }}
                >
                  Back
                </Button>
              </span>;
  } else if (inProgress) {
    response = <span>
                <Text size="md">
                  Please wait whilst your QR code is generated
                </Text>
                <Loader variant="dots" />
              </span>;
  } else if (!broadcastResult && !qrContents) {
    response = <span>
                  <Col span={12} key="Top">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                        <Text size="md">
                          Ready to issue NFTs on the Bitshares blockchain!
                        </Text>
                        <Text size="sm">
                          Make sure you have enough Bitshares tokens to cover the network fees.
                        </Text>
                        <Text size="sm">
                          To save on fees consider getting a Bitshares lifetime membership.
                        </Text>
                        <Button
                          sx={{margin: '5px'}}
                          onClick={() => {
                            openLink()
                          }}
                        >
                          BTS NFT Spec
                        </Button> 
                        <Button
                          onClick={() => {
                            back()
                          }}
                        >
                          Go back
                        </Button>   
                    </Paper>
                  </Col>
                  <Col span={12} key="ImageDetails">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          Image details
                      </Text>
                      <Text size="sm">
                        This NFT currently contains the following {asset_images && asset_images.length} images:
                      </Text>
                      {
                        asset_images
                        ? asset_images.map(item => {
                            return <Group key={item.url} sx={{margin: '5px'}}>
                                      <Text size="sm">
                                        {
                                          item.url
                                        }
                                      </Text>
                                    </Group>;
                          })
                        : null
                      }
                      <Button
                        onClick={() => {
                          changeImages()
                        }}
                      >
                        Change images
                      </Button>   
                    </Paper>
                  </Col>
                  <Col span={12} key="Asset Details">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          Asset details
                      </Text>
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
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          NFT details
                      </Text>
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
                      <Text size="md">
                          NFT Signatures
                      </Text>
                      {
                        accountType != "BEET"
                          ? <TextInput
                              label="Signed text"
                              placeholder="signed"
                              {...form.getInputProps('signed')}
                            />
                          : null
                      }
                      {
                        accountType != "BEET"
                          ? <TextInput
                              label="Signature"
                              placeholder="signature"
                              {...form.getInputProps('signature')}
                            />
                          : null
                      }
                    </Paper>
                  </Col>
                  <Col span={12} key="CER">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          Core Exchange Rate
                      </Text>
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
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          Permissions
                      </Text>
                      <Text size="sm">
                          Note: Disabling permissions is a permanent decision.
                      </Text>
                      {
                        !permissionBooleans.charge_market_fee
                        ? <Tooltip
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
                        : <Checkbox
                            mt="md"
                            label="Enable market fee (charge_market_fee)"
                            {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
                          />
                      }
                      <br/>
                      {
                        !permissionBooleans.white_list
                          ? <Tooltip
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
                          : <Checkbox
                              mt="md"
                              label="Require holders to be white-listed (white_list)"
                              {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.override_authority
                          ? <Tooltip
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
                          : <Checkbox
                              mt="md"
                              label="Asset owner may transfer asset back to himself (override_authority)"
                              {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.transfer_restricted
                          ? <Tooltip
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
                          : <Checkbox
                              mt="md"
                              label="Asset owner must approve all transfers (transfer_restricted)"
                              {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.disable_confidential
                          ? <Tooltip
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
                          : <Checkbox
                              mt="md"
                              label="Disable confidential transactions (disable_confidential)"
                              {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
                            />
                      }
                    </Paper>
                  </Col>
                  <Col span={12} key="Flags">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                          Flags
                      </Text>
                      <Text size="sm">
                          If a related permission above is enabled, these flags can be changed at any time. 
                      </Text>
                      {
                        !permissionBooleans.charge_market_fee// || form.values.perm_charge_market_fee === false
                          ? <Tooltip
                              label="Relavent permission was disabled."
                              color="gray"
                              withArrow
                            >
                              <Checkbox
                                mt="md"
                                disabled
                                label="Enable charging a market fee (charge_market_fee)"
                                {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                              />
                            </Tooltip>
                          : <Checkbox
                              mt="md"
                              label="Enable charging a market fee (charge_market_fee)"
                              {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.white_list// || form.values.perm_white_list === false
                          ? <Tooltip
                              label="Relavent permission was disabled."
                              color="gray"
                              withArrow
                            >
                              <Checkbox
                                mt="md"
                                disabled
                                label="Require holders to be white-listed (white_list)"
                                {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
                              />
                            </Tooltip>
                          : <Checkbox
                              mt="md"
                              label="Require holders to be white-listed (white_list)"
                              {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.override_authority// || form.values.perm_override_authority === false
                          ? <Tooltip
                              label="Relavent permission was disabled."
                              color="gray"
                              withArrow
                            >
                              <Checkbox
                                mt="md"
                                disabled
                                label="Asset owner may transfer asset back to himself (override_authority)"
                                {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                              />
                            </Tooltip>
                          : <Checkbox
                              mt="md"
                              label="Asset owner may transfer asset back to himself (override_authority)"
                              {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.transfer_restricted// || form.values.perm_transfer_restricted === false
                          ? <Tooltip
                              label="Relavent permission was disabled."
                              color="gray"
                              withArrow
                            >
                              <Checkbox
                                mt="md"
                                disabled
                                label="Asset owner must approve all transfers (transfer_restricted)"
                                {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                              />
                            </Tooltip>
                          : <Checkbox
                              mt="md"
                              label="Asset owner must approve all transfers (transfer_restricted)"
                              {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                            />
                      }
                      <br/>
                      {
                        !permissionBooleans.disable_confidential// || form.values.perm_disable_confidential === false
                          ? <Tooltip
                              label="Relavent permission was disabled."
                              color="gray"
                              withArrow
                            >
                              <Checkbox
                                mt="md"
                                disabled
                                label="Disable confidential transactions (disable_confidential)"
                                {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
                              />
                            </Tooltip>
                          : <Checkbox
                              mt="md"
                              label="Disable confidential transactions (disable_confidential)"
                              {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
                            />
                      }
                    </Paper>
                  </Col>
                  <Col span={12} key="SubmitBox">
                    <Paper sx={{padding: '5px'}} shadow="xs">
                      {
                        !inProgress
                          ? <span>
                              <Text color="red" size="md">
                                Complete the fields in the above form.
                              </Text>
                              <form onSubmit={form.onSubmit((values) => processForm(values, permissionBooleans, flagBooleans))}>
                                <Button type="submit">Submit</Button>
                              </form>
                            </span>
                          : <span>
                              <Loader variant="dots" />
                              <Text size="md">
                                Waiting on responses from BEET prompts
                              </Text>
                            </span>
                      }
                    </Paper>
                  </Col>
                </span>;
  } else if (broadcastResult) {
    response =  <Col span={12} key="Top">
                  <Paper sx={{padding: '5px'}} shadow="xs">
                      <Text size="md">
                        Successfully {mode === 'create' ? 'created' : 'updated'} your NFT on the {environment === 'production' ? 'Bitshares' : 'BTS Testnet'} blockchain!
                      </Text>
                      <Button
                        onClick={() => {
                          back()
                        }}
                      >
                        Go back
                      </Button>   
                  </Paper>
                </Col>;
  }

  return <Col span={12} key="Top">
            {response}
        </Col>;
}
