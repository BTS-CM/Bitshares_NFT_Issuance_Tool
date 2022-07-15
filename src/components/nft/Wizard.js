import { useEffect, useState } from 'react';

import { TextInput, Checkbox, Button, Group, Box, Text, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

export default function Wizard(properties) {
  const connection = properties.connection;
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

  async function processForm(values) {
    console.log(values);

    /*

      values.acknowledgements
      artist
      attestation
      encoding
      holder_license
      license
      narrative
      title
      tags
      type
      main
      market
      short_name
      symbol
      max_supply
      precision
      cer_base_amount
      cer_base_asset_id
      cer_quote_amount
      cer_quote_asset_id
      perm_charge_market_fee
      perm_white_list
      perm_override_authority
      perm_transfer_restricted
      perm_disable_confidential
      flag_charge_market_fee
      flag_white_list
      flag_override_authority
      flag_transfer_restricted
      flag_disable_confidential
      issuer
      sig_pubkey_or_address
      market_fee_percent
      max_market_fee

    */

    let TXBuilder = connection.inject(TransactionBuilder, {sign: true, broadcast: true});

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
      return processForm(values);
    }

    let tr = new TXBuilder();

    let nft_object = {
        acknowledgements: values.acknowledgements,
        artist: values.artist,
        attestation: values.attestation,
        encoding: values.encoding,
        holder_license: values.holder_license,
        license: values.license,
        narrative: values.narrative,
        sig_pubkey_or_address: values.sig_pubkey_or_address,
        title: values.title,
        tags: values.tags,
        type: values.type
      };
    
      // TODO: IMPROVE BELOW! Could be many types of file types, always on IPFS though
      if (values.media_png_multihash) {
        nft_object['media_png_multihash'] = values.media_png_multihash;
      }

      let nft_signature = Signature.signBuffer(Buffer.from(JSON.stringify(nft_object)), pMemoKey);
    
      let description = JSON.stringify({
          main: `${nftJSON.symbol} is an NFT created by nft.artist, deployed on the BitShares network. To view this token and others, visit https://nftea.gallery`,
          market: "BTS",
          nft_object: nft_object,
          nft_signature: nft_signature.toHex(),
          short_name: nftJSON.symbol
      });
    
      let operationJSON = {
        issuer: "1.2.1803677",
        symbol: nftJSON.symbol,
        precision: 0,
        common_options: {
            max_supply: 1,
            market_fee_percent: 0,
            max_market_fee: 0,
            issuer_permissions: 0,
            flags: 0,
            core_exchange_rate: {
                base: {
                    amount: 100000,
                    asset_id: "1.3.0"
                },
                quote: {
                    amount: 1,
                    asset_id: "1.3.1"
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
      
      /*
      console.log(
        "serialized transaction:",
        tr.serialize().operations
      );
      */

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

  const form = useForm({
    initialValues: {
        acknowledgements: '',
        artist: '',
        attestation: '',
        encoding: '',
        holder_license: '',
        license: '',
        narrative: '',
        title: '',
        tags: '',
        type: '',
        main: '',
        market: '',
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
        issuer: "1.2.1803677", // fetch from getaccount
        sig_pubkey_or_address: '', // fetch from getaccount
        market_fee_percent: 0,
        max_market_fee: 0
    },
    validate: {
        acknowledgements: (value) => (value instanceof String ? null : 'Invalid'),
        artist: (value) => (value instanceof String  ? null : 'Invalid'),
        attestation: (value) => (value instanceof String  ? null : 'Invalid'),
        encoding: (value) => (value instanceof String  ? null : 'Invalid'),
        holder_license: (value) => (value instanceof String  ? null : 'Invalid'),
        license: (value) => (value instanceof String  ? null : 'Invalid'),
        narrative: (value) => (value instanceof String  ? null : 'Invalid'),
        title: (value) => (value instanceof String  ? null : 'Invalid'),
        tags: (value) => (value instanceof String  ? null : 'Invalid'),
        type: (value) => (value instanceof String  ? null : 'Invalid'),
        main: (value) => (value instanceof String  ? null : 'Invalid'),
        market: (value) => (value instanceof String  ? null : 'Invalid'),
        short_name: (value) => (value instanceof String  ? null : 'Invalid'),
        symbol: (value) => (value instanceof String  ? null : 'Invalid'),
        max_supply: (value) => (value >= 0 ? null : 'Invalid'),
        precision: (value) => (value >= 0 ? null : 'Invalid'),
        sig_pubkey_or_address: (value) => (value instanceof String  ? null : 'Invalid'),
        //
        market_fee_percent: (value) => (value >= 0 && value <= 100  ? null : 'Invalid'),
        max_market_fee: (value) => (value >= 0 && value <= 100  ? null : 'Invalid'),
        issuer_permissions: (value) => (value instanceof String  ? null : 'Invalid'),
        flags: (value) => (value instanceof String  ? null : 'Invalid'),
    }
  });

  return (
    <Box sx={{ maxWidth: 300 }} mx="auto">
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
          label="NFT type"
          placeholder="Type of NFT"
          {...form.getInputProps('type')}
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
        <TextInput
          required
          label="sig_pubkey_or_address"
          placeholder="Public key or address used for NFT signature"
          {...form.getInputProps('sig_pubkey_or_address')}
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
