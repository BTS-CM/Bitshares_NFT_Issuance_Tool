
import { useEffect, useState } from 'react';
import { TextInput, Checkbox, Button, Group, Box, Text, Divider } from '@mantine/core';
import { Dropzone, DropzoneStatus, MIME_TYPES } from '@mantine/dropzone';

export default function Upload(properties) {
  const setImage = properties.setImage;
  const setOnchain = properties.setOnchain;

  function getBase64(file) {
    return new Promise(resolve => {
      let baseURL = "";
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        baseURL = reader.result;
        resolve(baseURL);
      };
    });
  }

  function process(file) {
    let base64 = getBase64(file);
    setImage(base64);
  }

  const dropzoneChildren = (status) => (
    <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
      <div>
        <Text size="xl" inline>
          Drag a single image here or click to select a file manually
        </Text>
        <Text size="sm" color="dimmed" inline mt={7}>
          For now only PNG and JPEG file formats are supported for onchain storage.
        </Text>
      </div>
    </Group>
  );

  return (
    <Box mx="auto">
      <Dropzone
        onDrop={(files) => process(files[0])}
        onReject={(files) => console.log('rejected files', files)}
        maxSize={3 * 1024 ** 2}
        accept={[MIME_TYPES.png, MIME_TYPES.jpeg]}
      >
        {(status) => dropzoneChildren(status)}
      </Dropzone>
      <Button
        sx={{margin: '15px'}}
        onClick={() => {
          setOnchain()
        }}
      >
        Back
      </Button>
    </Box>
  );
}
