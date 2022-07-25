import { Button, Box, Text } from '@mantine/core';

export default function Mode(properties) {
  const setMode = properties.setMode;
  
  return (
    <Box mx="auto" sx={{padding: '10px'}}>
      <span>
        <Text size="md">
          Are you creating a new NFT or editing an existing one?
        </Text>
        <Button
          sx={{marginTop: '15px', marginRight: '5px', marginLeft: '5px'}}
          onClick={() => {
            setMode('create');
          }}
        >
          Creating
        </Button>
        <Button
          sx={{marginTop: '15px', marginRight: '5px'}}
          onClick={() => {
            setMode('edit');
          }}
        >
          Editing
        </Button>
      </span>
    </Box>
  );
}
