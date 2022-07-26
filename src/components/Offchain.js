
import { useState } from 'react';
import { TextInput, Button, Group, Box, Text, Divider } from '@mantine/core';

export default function Offchain(properties) {
  const setImages = properties.setImages;
  const setMode = properties.setMode;

  let allowedFileTypes = [".png", ".PNG", ".gif", ".GIF", ".jpg", ".JPG", ".jpeg", ".JPEG"];

  const [value, setValue] = useState('');
  const [listItems, setListItems] = useState([]);
  const [chosenFileType, setChosenFileType] = useState();

  function addListItem() {
    let currentListItems = listItems;
    let existingListItem = listItems.filter(listItem => listItem.url === value);
    if (!existingListItem.length) {
      let fileType;
      let valueSlice = value.substr(value.length - 5);
      if (valueSlice.includes('.png') || valueSlice.includes('.PNG')) {
        fileType = 'PNG';
      } else if (valueSlice.includes('.gif') || valueSlice.includes('.GIF')) {
        fileType = 'GIF';
      } else if (valueSlice.includes('.jpeg') || valueSlice.includes('.JPEG')) {
        fileType = 'JPEG';
      } else {
        console.log('Unsupported filetype');
        return;
      }

      if (chosenFileType && fileType !== chosenFileType) {
        console.log('All files must have the same file format.');
        return;
      }

      setChosenFileType(fileType);
      currentListItems.push({url: value, type: fileType});
      setListItems(currentListItems);
    }
    setValue('');
  }

  function removeListItem(item) {
    if (listItems.length === 1) {
      setListItems();
      setFileTypes();
      return;
    }

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
        let four = value.substr(value.length - 4);
        let five = value.substr(value.length - 5);
        if (allowedFileTypes.includes(four) || allowedFileTypes.includes(five)) {
          addListItem()
        }
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
            return <Group key={item.url} sx={{margin: '5px'}}>
                      <Button
                        compact
                        variant="outline"
                        onClick={() => {
                          removeListItem(item.url)
                        }}
                      >
                        ❌
                      </Button>
                      <Text size="sm">
                        {
                          item.url.length > 50
                            ? item.url.substring(0, 50) + "..."
                            : item.url
                        } ({item.type})</Text>
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
