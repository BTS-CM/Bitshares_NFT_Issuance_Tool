import { useState } from 'react';

import { TextInput, Checkbox, Button, Box, Text, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

export default function Wizard(properties) {
  const connection = properties.connection;
  const userID = properties.userID;
  
  const [broadcastResult, setBroadcastResult] = useState();

  const images = properties.images;
  const setImages = properties.setImages;

  const environment = properties.environment;
  const wsURL = properties.wsURL;
  const nodes = properties.nodes;
  const setNodes = properties.setNodes;
  const setProdConnection = properties.setProdConnection;
  const setTestnetConnection = properties.setTestnetConnection;

  function back() {
    setImages();
  }

  function changeURL() {
    let nodesToChange = nodes;
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    setNodes(nodesToChange);
    console.log(`Setting new node connection to: ${nodesToChange[0]}`)
    if (environment === 'production') {
      setProdConnection(nodesToChange[0]);
    } else {
      setTestnetConnection(nodesToChange[0]);
    }
  }

  /**
   * broadcast the create asset operation
   * @param {Object} operationJSON 
   */
  async function broadcastOperation(operationJSON) {
    let TXBuilder = connection.inject(TransactionBuilder, {sign: true, broadcast: true});
    let tr = new TXBuilder();

    try {
      await Apis.instance(
          wsURL,
          true,
          10000,
          {enableCrypto: false, enableOrders: true},
          (error) => console.log(error),
      ).init_promise;
    } catch (error) {
      console.log(`api instance: ${error}`);
      changeURL();
      return broadcastOperation(operationJSON);
    }

    tr.add_type_operation("asset_create", operationJSON);

    /*
    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      return;
    }
    */

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

    console.log(JSON.stringify(result));
    setBroadcastResult(result);
  }

  
  /**
   * Asking user to broadcast asset create operation with 
   * @param {Object} values 
   * @param {Object} nft_object 
   * @param {Object} signedPayload 
   */
  async function submitForm(values, nft_object, signedPayload) {
    let description = JSON.stringify({
        main: values.main,
        market: values.market,
        nft_object: nft_object,
        nft_signature: signedPayload,
        //nft_signature: nft_signature.toHex(),
        short_name: values.short_name
    });

    let operationJSON = {
      issuer: userID,
      symbol: nftJSON.symbol,
      precision: values.precision,
      common_options: {
          max_supply: values.max_supply,
          market_fee_percent: values.market_fee_percent,
          max_market_fee: values.max_market_fee,
          issuer_permissions: 0,
          flags: 0,
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
    };

    await broadcastOperation(operationJSON);
  }

  /**
   * Signing primary form values with memo key prior to broadcast
   * @param {Object} values 
   */
  async function processForm(values) {
      let nft_object = {
          acknowledgements: values.acknowledgements,
          artist: values.artist,
          attestation: values.attestation,
          encoding: images[0].type,
          holder_license: values.holder_license,
          license: values.license,
          narrative: values.narrative,
          title: values.title,
          tags: values.tags,
          type: values.type
      };
    
      //nft_object[`media_${images[0].type}_multihash`] = images[0].url;
      //nft_object[`media_${images[0].type}_multihashes`] = images.map(image => image.url);

      let signedPayload;
      try {
        signedPayload = await connection.signNFT(nft_object);
      } catch (error) {
        console.log(error);
        return;
      }
     
      console.log(signedPayload);
      return;
      //return await submitForm(values, nft_object, signedPayload);
   }

  const form = useForm({
    initialValues: {
        acknowledgements: '',
        artist: '',
        attestation: '',
        encoding: 'ipfs',
        holder_license: '',
        license: '',
        narrative: '',
        title: '',
        tags: '',
        type: 'NFT/ART/VISUAL',
        main: '',
        market: 'BTS',
        short_name: '',
        symbol: '', // check
        max_supply: 1,
        precision: 0,
        // core_exchange_rate
        cer_base_amount: 100000,
        cer_base_asset_id: "1.3.0",
        cer_quote_amount: 1,
        cer_quote_asset_id: "1.3.1",
        // permissions
        perm_charge_market_fee: true,
        perm_white_list: true,
        perm_override_authority: true,
        perm_transfer_restricted: true,
        perm_disable_confidential: true,
        // flags
        flag_charge_market_fee: false,
        flag_white_list: false,
        flag_override_authority: false,
        flag_transfer_restricted: false,
        flag_disable_confidential: false,
        // operationsJSON
        issuer: userID, // fetch from getaccount
        market_fee_percent: 0,
        max_market_fee: 0
    },
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
        market_fee_percent: (value) => (value >= 0 && value <= 100  ? null : 'Invalid'),
        max_market_fee: (value) => (value >= 0 && value <= 100  ? null : 'Invalid')
    }
  });

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
      <Text size="md">
        Ready to issue NFTs on the Bitshares blockchain!
      </Text>
      <form onSubmit={form.onSubmit((values) => processForm(values))}>
        <br/>
        <Text size="md">
            Image details
        </Text>
        <Text size="sm">
            
        </Text>
        <Button
          onClick={() => {
            back()
          }}
        >
          Go back
        </Button>

        <br/>
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
        <Divider sx={{marginTop: '15px', marginBottom: '5px'}}></Divider>
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
          label="NFT encoding"
          placeholder="Image encoding format e.g. PNG"
          {...form.getInputProps('encoding')}
        />
        <TextInput
          required
          label="NFT tags"
          placeholder="comma,separated,tags"
          {...form.getInputProps('tags')}
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
        <Divider sx={{marginTop: '15px', marginBottom: '5px'}}></Divider>
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
        <Divider sx={{marginTop: '15px', marginBottom: '5px'}}></Divider>
        <Text size="md">
            Permissions
        </Text>
        <Text size="sm">
            Note: Disabling permissions is a permanent decision.
        </Text>
        <Checkbox
          mt="md"
          label="charge_market_fee"
          {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="white_list"
          {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="override_authority"
          {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="transfer_restricted"
          {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="disable_confidential"
          {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
        />
        <Divider sx={{marginTop: '15px', marginBottom: '5px'}}></Divider>
        <Text size="md">
            Flags
        </Text>
        <Text size="sm">
            If a related permission above is enabled, these flags can be changed at any time. 
        </Text>
        <Checkbox
          mt="md"
          label="charge_market_fee"
          {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="white_list"
          {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="override_authority"
          {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="transfer_restricted"
          {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
        />
        <Checkbox
          mt="md"
          label="disable_confidential"
          {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
        />
        <TextInput
          required
          label="market_fee_percent"
          placeholder="0"
          {...form.getInputProps('market_fee_percent')}
        />
        <TextInput
          required
          label="max_market_fee"
          placeholder="0"
          {...form.getInputProps('max_market_fee')}
        />
        <span>
            <br/>
            <Text color="red" size="md">
                    Complete the fields in the above form.
            </Text>
            <Button type="submit">Submit</Button>
        </span>       
      </form>
    </Box>
  );
}
