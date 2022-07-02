
import { useEffect, useState } from 'react';
import { TextInput, Checkbox, Button, Group, Box, Text, Divider } from '@mantine/core';
import { Dropzone, DropzoneStatus, MIME_TYPES } from '@mantine/dropzone';

export default function Offchain(properties) {
  const setImage = properties.setImage;
  const setImages = properties.setImages;
  const setIPFS = properties.setIPFS;

  const [value, setValue] = useState('');
  const [listItems, setListItems] = useState([]);

  function addListItem() {
    let currentListItems = listItems;
    if (!listItems.includes(value)) {
      currentListItems.push(value);
      setListItems(currentListItems);
    }
    setValue('');
  }

  function removeListItem(item) {
    let currentListItems = listItems;
    let newListItems = currentListItems.filter(listItem => listItem != item);
    console.log(`removed: ${item}`);
    setListItems(newListItems);
  }

  function proceed() {
    console.log('proceed')
    setImage(listItems[0]);
    setImages(listItems);
  }

  let proceedButton = listItems.length
      ? <Button
          sx={{margin: '5px'}}
          onClick={() => {
            proceed()
          }}
        >
          Proceed with issuance
        </Button>
      : <Button
          sx={{margin: '5px'}}
          disabled
        >
          Proceed with issuance
        </Button>

  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      <Group sx={{marginTop: '10px', marginBottom: '10px'}}>
        <TextInput value={value} onChange={(event) => setValue(event.currentTarget.value)} />
        <Button
          onClick={() => {
            addListItem()
          }}
        >
          Add IPFS url
        </Button>
      </Group>
      <Text size="sm" weight={600}>
        {
          listItems.length
            ? "IPFS URLs"
            : null
        }
      </Text>
        {
          listItems.map(item => {
            return <Group sx={{margin: '5px'}}>
                      <Text size="sm">{item}</Text>
                      <Button
                        compact
                        variant="outline"
                        onClick={() => {
                          removeListItem(item)
                        }}
                      >
                        ❌
                      </Button>
                    </Group>;
          })
        }
      <Divider sx={{marginTop: '15px', marginBottom: '5px'}}></Divider>
      {
        proceedButton
      }
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          setIPFS()
        }}
      >
        Back
      </Button>
    </Box>
  );
}
