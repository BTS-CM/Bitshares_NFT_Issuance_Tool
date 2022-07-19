
import { useState } from 'react';
import { TextInput, Button, Group, Box, Text, Divider } from '@mantine/core';

export default function Offchain(properties) {
  const setImages = properties.setImages;
  const setMode = properties.setMode;

  const [value, setValue] = useState('');
  const [listItems, setListItems] = useState([]);
  const [fileTypes, setFileTypes] = useState();

  function addListItem() {
    let currentListItems = listItems;
    if (!listItems.includes(value)) {
      // .map(item => item.type)

      let fileType;
      if (value.includes('.png') || value.includes('.PNG')) {
        fileType = 'PNG';
      } else if (value.includes('.jpeg') || value.includes('.JPEG')) {
        fileType = 'JPEG';
      } else if (value.includes('.gif') || value.includes('.GIF')) {
        fileType = 'GIF';
      } else {
        console.log('Unsupported filetype');
        return;
      }

      if (fileTypes && fileType === fileTypes) {
        console.log('All files must have the same file format.');
        return;
      }

      setFileTypes(fileType);
      currentListItems.push({url: value, type: fileType});
      setListItems(currentListItems);
    }
    setValue('');
  }

  function removeListItem(item) {
    let currentListItems = listItems;
    let newListItems = currentListItems.filter(listItem => listItem.url != item);
    setListItems(newListItems);

    if (!listItems.length) {
      setFileTypes();
    }
  }

  function proceed() {
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

  let ipfsButton = value
  ? <Button
      onClick={() => {
        addListItem()
      }}
    >
      Add IPFS url
    </Button>
  : <Button disabled>
      Add IPFS url
    </Button>;

  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      <Text size="sm">
        At the moment only PNG, JPEG and GIF files are supported.
      </Text>
      <Group sx={{marginTop: '10px', marginBottom: '10px'}}>
        <TextInput value={value} onChange={(event) => setValue(event.currentTarget.value)} />
        {ipfsButton}
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
            return <Group key={item.url.split(".")[0]} sx={{margin: '5px'}}>
                      <Text size="sm">{item.url}</Text>
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
          setMode()
        }}
      >
        Back
      </Button>
    </Box>
  );
}
