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
import { useTranslation } from 'react-i18next';

import { appStore, beetStore, identitiesStore } from '../../lib/states';
import { getPermissions, getFlags, getFlagBooleans } from '../../lib/permissions';
import { generateObject, broadcastOperation } from '../../lib/broadcasts';

function openLink() {
  window.electron.openURL('nft_spec');
}

export default function Wizard(properties) {
  const { t, i18n } = useTranslation();
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
      artist: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      attestation: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      title: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      main: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      market: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      short_name: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      symbol: (value) => (value.length > 0 ? null : t('blockchain:wizard.invalid')),
      max_supply: (value) => (value >= 0 ? null : t('blockchain:wizard.invalid')),
      precision: (value) => (value >= 0 ? null : t('blockchain:wizard.invalid')),
      flag_charge_market_fee: (value, values) => (value === true && !values.perm_charge_market_fee ? t('blockchain:wizard.invalid') : null),
      flag_white_list: (value, values) => (value === true && !values.perm_white_list ? t('blockchain:wizard.invalid') : null),
      flag_override_authority: (value, values) => (value === true && !values.perm_override_authority ? t('blockchain:wizard.invalid') : null),
      flag_transfer_restricted: (value, values) => (value === true && !values.perm_transfer_restricted ? t('blockchain:wizard.invalid') : null),
      flag_disable_confidential: (value, values) => (value === true && !values.perm_disable_confidential ? t('blockchain:wizard.invalid') : null),
    },
    validateInputOnChange: true,
  });

  let response;
  if (qrContents) {
    response = (
      <span>
        <Text size="md" sx="margin-bottom:15px;">
          {
            mode === 'create'
              ? t('blockchain:wizard.broadcastCreate')
              : t('blockchain:wizard.broadcastUpdate')
          }
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
          {t('blockchain:wizard.back')}
        </Button>
      </span>
    );
  } else if (inProgress) {
    response = (
      <span>
        <Text size="md">
          {t('blockchain:wizard.inProgress')}
        </Text>
        <Loader variant="dots" />
      </span>
    );
  } else if (!broadcastResult && !qrContents) {
    response = (
      <span>
        <Col span={12} key="Top">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.header')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.subHeader')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.feeTip')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.poolTip')}
            </Text>
            <Button
              sx={{ margin: '5px' }}
              onClick={() => {
                openLink();
              }}
            >
              {t('blockchain:wizard.form.spec')}
            </Button>
            <Button
              onClick={() => {
                back();
              }}
            >
              {t('blockchain:wizard.back')}
            </Button>
          </Paper>
        </Col>
        <Col span={12} key="ImageDetails">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.imgHeader')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.qtyImages', { qty: asset_images && asset_images.length })}
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
              {t('blockchain:wizard.form.changeImages')}
            </Button>
          </Paper>
        </Col>
        <Col span={12} key="Asset Details">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">Asset details</Text>
            <TextInput
              required
              disabled
              label={t('blockchain:wizard.form.issuerLabel')}
              placeholder="1.2.x"
              {...form.getInputProps('issuer')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.symbolLabel')}
              placeholder={t('blockchain:wizard.form.symbolPlaceholder')}
              {...form.getInputProps('symbol')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.mainLabel')}
              placeholder={t('blockchain:wizard.form.mainPlaceholder')}
              {...form.getInputProps('main')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.snLabel')}
              placeholder={t('blockchain:wizard.form.snPlaceholder')}
              {...form.getInputProps('short_name')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.marketLabel')}
              placeholder={t('blockchain:wizard.form.marketPlaceholder')}
              {...form.getInputProps('market')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.msLabel')}
              placeholder="1"
              {...form.getInputProps('max_supply')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.precisionLabel')}
              placeholder="1"
              {...form.getInputProps('precision')}
            />
          </Paper>
        </Col>
        <Col span={12} key="NFT Details">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.nftHeader')}
            </Text>
            <TextInput
              required
              label={t('blockchain:wizard.form.titleLabel')}
              placeholder={t('blockchain:wizard.form.titlePlaceholder')}
              {...form.getInputProps('title')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.artistLabel')}
              placeholder={t('blockchain:wizard.form.artistPlaceholder')}
              {...form.getInputProps('artist')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.narrativeLabel')}
              placeholder={t('blockchain:wizard.form.narrativePlaceholder')}
              {...form.getInputProps('narrative')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.tagsLabel')}
              placeholder={t('blockchain:wizard.form.tagsPlaceholder')}
              {...form.getInputProps('tags')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.typeLabel')}
              placeholder={t('blockchain:wizard.form.typePlaceholder')}
              {...form.getInputProps('type')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.attestationLabel')}
              placeholder={t('blockchain:wizard.form.attestationPlaceholder')}
              {...form.getInputProps('attestation')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.ackLabel')}
              placeholder={t('blockchain:wizard.form.ackPlaceholder')}
              {...form.getInputProps('acknowledgements')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.holderLicenceLabel')}
              placeholder={t('blockchain:wizard.form.holderLicencePlaceholder')}
              {...form.getInputProps('holder_license')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.licenseLabel')}
              placeholder={t('blockchain:wizard.form.licensePlaceholder')}
              {...form.getInputProps('license')}
            />
            <Text size="md">{t('blockchain:wizard.form.sigHeader')}</Text>
            {accountType !== 'BEET' ? (
              <TextInput
                label={t('blockchain:wizard.form.signedLabel')}
                placeholder={t('blockchain:wizard.form.signedPlaceholder')}
                {...form.getInputProps('signed')}
              />
            ) : null}
            {accountType !== 'BEET' ? (
              <TextInput
                label={t('blockchain:wizard.form.signedLabel')}
                placeholder={t('blockchain:wizard.form.signedPlaceholder')}
                {...form.getInputProps('signature')}
              />
            ) : null}
          </Paper>
        </Col>
        <Col span={12} key="CER">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.cerHeader')}
            </Text>
            <TextInput
              required
              label={t('blockchain:wizard.form.cerbaLabel')}
              placeholder="0"
              {...form.getInputProps('cer_base_amount')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.cerbaLabel')}
              placeholder="1.3.x"
              {...form.getInputProps('cer_base_asset_id')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.cerqaLabel')}
              placeholder="0"
              {...form.getInputProps('cer_quote_amount')}
            />
            <TextInput
              required
              label={t('blockchain:wizard.form.cerqaIDLabel')}
              placeholder="1.3.x"
              {...form.getInputProps('cer_quote_asset_id')}
            />
          </Paper>
        </Col>
        <Col span={12} key="Perms">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.permsHeader')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.permsSubHeader')}
            </Text>
            {!permissionBooleans.charge_market_fee ? (
              <Tooltip
                label={t('blockchain:wizard.form.disabledCMF')}
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.cmfPLabel')}
                  {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.cmfPLabel')}
                {...form.getInputProps('perm_charge_market_fee', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.white_list ? (
              <Tooltip
                label={t('blockchain:wizard.form.disabledWL')}
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.wlLabel')}
                  {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.wlLabel')}
                {...form.getInputProps('perm_white_list', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.override_authority ? (
              <Tooltip
                label={t('blockchain:wizard.form.disabledPOA')}
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.poaLabel')}
                  {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.poaLabel')}
                {...form.getInputProps('perm_override_authority', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.transfer_restricted ? (
              <Tooltip
                label={t('blockchain:wizard.form.disabledTR')}
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.trLabel')}
                  {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.trLabel')}
                {...form.getInputProps('perm_transfer_restricted', { type: 'checkbox' })}
              />
            )}
            <br />
            {!permissionBooleans.disable_confidential ? (
              <Tooltip
                label={t('blockchain:wizard.form.disabledDC')}
                color="gray"
                withArrow
              >
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.dcLabel')}
                  {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.dcLabel')}
                {...form.getInputProps('perm_disable_confidential', { type: 'checkbox' })}
              />
            )}
          </Paper>
        </Col>
        <Col span={12} key="Flags">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <Text size="md">
              {t('blockchain:wizard.form.flagsHeader')}
            </Text>
            <Text size="sm">
              {t('blockchain:wizard.form.flagsSubHeader')}
            </Text>
            {
              !permissionBooleans.charge_market_fee
                ? ( // || form.values.perm_charge_market_fee === false
                  <Tooltip label={t('blockchain:wizard.form.disabledLabel')} color="gray" withArrow>
                    <Checkbox
                      mt="md"
                      disabled
                      label={t('blockchain:wizard.form.fcmfLabel')}
                      {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                    />
                  </Tooltip>
                ) : (
                  <Checkbox
                    mt="md"
                    label={t('blockchain:wizard.form.fcmfLabel')}
                    {...form.getInputProps('flag_charge_market_fee', { type: 'checkbox' })}
                  />
                )
}
            <br />
            {!permissionBooleans.white_list ? ( // || form.values.perm_white_list === false
              <Tooltip label={t('blockchain:wizard.form.disabledLabel')} color="gray" withArrow>
                <Checkbox
                  mt="md"
                  disabled
                  label={t('blockchain:wizard.form.fwlLabel')}
                  {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
                />
              </Tooltip>
            ) : (
              <Checkbox
                mt="md"
                label={t('blockchain:wizard.form.fwlLabel')}
                {...form.getInputProps('flag_white_list', { type: 'checkbox' })}
              />
            )}
            <br />
            {
            !permissionBooleans.override_authority
              ? ( // || form.values.perm_override_authority === false
                <Tooltip label={t('blockchain:wizard.form.disabledLabel')} color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label={t('blockchain:wizard.form.foaLabel')}
                    {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label={t('blockchain:wizard.form.foaLabel')}
                  {...form.getInputProps('flag_override_authority', { type: 'checkbox' })}
                />
              )
}
            <br />
            {
            !permissionBooleans.transfer_restricted
              ? ( // || form.values.perm_transfer_restricted === false
                <Tooltip label={t('blockchain:wizard.form.disabledLabel')} color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label={t('blockchain:wizard.form.ftrLabel')}
                    {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label={t('blockchain:wizard.form.ftrLabel')}
                  {...form.getInputProps('flag_transfer_restricted', { type: 'checkbox' })}
                />
              )
}
            <br />
            {
            !permissionBooleans.disable_confidential
              ? ( // || form.values.perm_disable_confidential === false
                <Tooltip label={t('blockchain:wizard.form.disabledLabel')} color="gray" withArrow>
                  <Checkbox
                    mt="md"
                    disabled
                    label={t('blockchain:wizard.form.fdcLabel')}
                    {...form.getInputProps('flag_disable_confidential', { type: 'checkbox' })}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  mt="md"
                  label={t('blockchain:wizard.form.fdcLabel')}
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
                  {t('blockchain:wizard.form.submitHeader')}
                </Text>
                <form
                  onSubmit={
                    form.onSubmit((values) => processForm(values))
                  }
                >
                  <Button mt="sm" compact type="submit">
                    {t('blockchain:wizard.form.submitBtn')}
                  </Button>
                </form>
              </span>
            ) : (
              <span>
                <Loader variant="dots" />
                <Text size="md">
                  {t('blockchain:wizard.form.waitBeet')}
                </Text>
              </span>
            )}
          </Paper>
        </Col>
        <Col span={12} key="SaveBox">
          <Paper sx={{ padding: '5px' }} shadow="xs">
            <span>
              <Text size="sm">
                {t('blockchain:wizard.form.saveDraftLabel')}
              </Text>
              <form
                onSubmit={
                      form.onSubmit((values) => saveForm(values))
                    }
              >
                {
                      form.values.symbol
                        ? <Button mt="sm" compact type="submit">{t('blockchain:wizard.form.saveBtn')}</Button>
                        : <Button mt="sm" compact disabled type="submit">{t('blockchain:wizard.form.saveBtn')}</Button>
                    }
              </form>
              <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={t('blockchain:wizard.form.modalTitle')}
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
                            {t('blockchain:wizard.form.viewJSON')}
                          </Button>
                        )
                        : (
                          <Button
                            mt="sm"
                            compact
                            disabled
                            type="submit"
                          >
                            {t('blockchain:wizard.form.viewJSON')}
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
            {
              t(
                'blockchain:wizard.form.broadcastSuccess',
                {
                  action: mode === 'create'
                    ? t('blockchain:wizard.form.broadcastActionCreate')
                    : t('blockchain:wizard.form.broadcastActionUpdate'),
                  network: environment === 'production' ? 'Bitshares' : 'BTS Testnet',
                },
              )
            }
          </Text>
          <Button
            onClick={() => {
              back();
            }}
          >
            {t('blockchain:wizard.back')}
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
