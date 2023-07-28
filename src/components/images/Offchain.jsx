import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Group,
  Box,
  Table,
  Text,
  Col,
  Paper,
  Radio,
  TextInput,
  Accordion,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { TbArrowNarrowRight, TbForms } from "react-icons/tb";

import {
  tempStore,
} from '../../lib/states';

function openURL(target) {
  window.electron.openURL(target);
}

export default function Offchain(properties) {
  const { t, i18n } = useTranslation();
  const theme = useMantineTheme();

  const asset_images = tempStore((state) => state.asset_images);
  const setAssetImages = tempStore((state) => state.setAssetImages);
  const changing_images = tempStore((state) => state.changing_images);
  const setChangingImages = tempStore((state) => state.setChangingImages);

  const [fileType, setFileType] = useState();

  const [value, setValue] = useState('');
  const [listItems, setListItems] = useState(
    changing_images && asset_images && asset_images.length ? asset_images : [],
  );

  function goBack() {
    if (changing_images) {
      setChangingImages(false);
    }
  }

  // Avoid duplicate files, and add the URL to the list
  function addListItem() {
    if (value && value.length) {
      const currentListItems = listItems;
      const existingListItem = listItems.filter((listItem) => listItem.url === value);
      if (!existingListItem.length) {
        currentListItems.push({ url: value, type: fileType });
        setListItems(currentListItems);
      }
      setValue('');
    }
  }

  /**
   * Remove an IPFS item from the list
   * @param {Array} item
   */
  function removeListItem(item) {
    if (listItems && listItems.length === 1) {
      setListItems([]);
      return;
    }

    const currentListItems = listItems;
    const newListItems = currentListItems.filter((listItem) => listItem.url !== item);
    setListItems(newListItems);
  }

  // Proceed to the wizard page
  function proceed() {
    setChangingImages(false);
    setAssetImages(listItems);
  }

  const proceedButton = listItems && listItems.length ? (
    <Button
      sx={{ margin: '5px' }}
      onClick={() => {
        proceed();
      }}
    >
      {t('images:offchain.continueBtn')}
    </Button>
  ) : (
    <Button sx={{ margin: '5px' }} disabled>
      {t('images:offchain.continueBtn')}
    </Button>
  );

  const ipfsButton = value ? (
    <Button
      onClick={() => {
        addListItem();
      }}
    >
      {t('images:offchain.ipfsBtn')}
    </Button>
  ) : (
    <Button disabled>{t('images:offchain.ipfsBtn')}</Button>
  );

  return (
    <>
      <Col span={12}>
        <Paper padding="sm" shadow="xs">
          <Box mx="auto" sx={{ padding: '10px' }}>
            <Text size="sm">
              {t('images:offchain.header')}
            </Text>
            <Radio.Group
              value={fileType}
              onChange={setFileType}
              name="fileTypeRadioGroup"
              label={t('images:offchain.typeLabel')}
              description={t('images:offchain.typeDesc')}
              withAsterisk
            >
              <Accordion mt="xs" defaultValue="images">
                <Accordion.Item key="json" value="images">
                  <Accordion.Control>
                    <Text align="left" size="md">
                      { t('images:formats.images') }
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      <Radio value="PNG" label="PNG" />
                      <Radio value="WEBP" label="WEBP" />
                      <Radio value="JPEG" label="JPEG" />
                      <Radio value="GIF" label="GIF" />
                      <Radio value="TIFF" label="TIFF" />
                      <Radio value="BMP" label="BMP" />
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key="json" value="audio">
                  <Accordion.Control>
                    <Text align="left" size="md">
                      { t('images:formats.audio') }
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      <Radio value="MP3" label="MP3" />
                      <Radio value="MP4" label="MP4" />
                      <Radio value="M4A" label="M4A" />
                      <Radio value="OGG" label="OGG" />
                      <Radio value="FLAC" label="FLAC" />
                      <Radio value="WAV" label="WAV" />
                      <Radio value="WMA" label="WMA" />
                      <Radio value="AAC" label="AAC" />
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key="json" value="video">
                  <Accordion.Control>
                    <Text align="left" size="md">
                      { t('images:formats.video') }
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      <Radio value="WEBM" label="WEBM" />
                      <Radio value="MOV" label="MOV" />
                      <Radio value="QT" label="QT" />
                      <Radio value="AVI" label="AVI" />
                      <Radio value="WMV" label="WMV" />
                      <Radio value="MPEG" label="MPEG" />
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key="json" value="document">
                  <Accordion.Control>
                    <Text align="left" size="md">
                      { t('images:formats.document') }
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      <Radio value="PDF" label="PDF" />
                      <Radio value="DOCX" label="DOCX" />
                      <Radio value="ODT" label="ODT" />
                      <Radio value="XLSX" label="XLSX" />
                      <Radio value="ODS" label="ODS" />
                      <Radio value="PPTX" label="PPTX" />
                      <Radio value="TXT" label="TXT" />
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key="json" value="3D">
                  <Accordion.Control>
                    <Text align="left" size="md">
                      { t('images:formats.3D') }
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      <Radio value="OBJ" label="OBJ" />
                      <Radio value="FBX" label="FBX" />
                      <Radio value="GLTF" label="GLTF" />
                      <Radio value="3DS" label="3DS" />
                      <Radio value="STL" label="STL" />
                      <Radio value="COLLADA" label="COLLADA" />
                      <Radio value="3MF" label="3MF" />
                      <Radio value="BLEND" label="BLEND" />
                      <Radio value="SKP" label="SKP" />
                      <Radio value="VOX" label="VOX" />
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Radio.Group>

            {
              fileType
                ? (
                  <TextInput
                    icon={<TbForms />}
                    radius="xl"
                    label={t('images:offchain.ipfsURL')}
                    size="md"
                    value={value}
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        addListItem();
                      }
                    }}
                    onChange={(e) => {
                      setValue(e.currentTarget.value);
                    }}
                    rightSection={(
                      <ActionIcon
                        size={32}
                        radius="xl"
                        color={theme.primaryColor}
                        onClick={() => {
                          addListItem();
                        }}
                        variant="filled"
                      >
                        <TbArrowNarrowRight />
                      </ActionIcon>
                    )}
                    placeholder={`/ipfs/CID/fileName.${fileType} || /ipfs/CID`}
                    rightSectionWidth={42}
                  />
                )
                : null
            }

          </Box>
        </Paper>
      </Col>
      {listItems && listItems.length ? (
        <Col span={12}>
          <Paper padding="sm" shadow="xs">
            <Box mx="auto" sx={{ padding: '10px' }}>
              <Text size="sm" weight={600}>
                {t('images:offchain.urlHeader')}
              </Text>
              <Table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>
                      File name
                    </th>
                    <th style={{ textAlign: 'center' }} colSpan={2}>
                      File type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listItems.map((item) => (
                    <tr key={item.url}>
                      <td>
                        {item.url}
                      </td>
                      <td>
                        {item.type}
                      </td>
                      <td>
                        <Button
                          compact
                          variant="outline"
                          onClick={() => {
                            removeListItem(item.url);
                          }}
                        >
                          ❌
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {proceedButton}
            </Box>
          </Paper>
        </Col>
      ) : (
        <Col span={12}>
          <Paper padding="sm" shadow="xs">
            <Box mx="auto" sx={{ padding: '10px' }}>
              <Text size="sm">
                {t('images:offchain.newHeader')}
              </Text>
              <Text size="sm">
                {t('images:offchain.serviceList')}
              </Text>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_pinata');
                }}
              >
                Pinata
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_nft_storage');
                }}
              >
                NFT.Storage
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_web3_storage');
                }}
              >
                Web3.Storage
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_fleek');
                }}
              >
                Fleek
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_infura');
                }}
              >
                Infura
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_storj');
                }}
              >
                Storj DCS
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_eternum');
                }}
              >
                Eternum
              </Button>
              <Button
                compact
                sx={{ margin: '2px' }}
                onClick={() => {
                  openURL('ipfs_docs');
                }}
              >
                IPFS NFT Docs
              </Button>
            </Box>
          </Paper>
          <Link style={{ textDecoration: 'none' }} to="/">
            <Button
              mt="sm"
              compact
              sx={{ marginTop: '5px', marginLeft: '5px' }}
              onClick={() => {
                goBack();
              }}
            >
              {t('images:offchain.back')}
            </Button>
          </Link>
        </Col>
      )}
    </>
  );
}
