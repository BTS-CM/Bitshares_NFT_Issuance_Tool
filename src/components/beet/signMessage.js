import { useState, useEffect } from 'react';

import {
  Button,
  TextInput
} from '@mantine/core';

export default function SignMessage(properties) {
  let connection = properties.connection;

  const [messageToSign, setMessageToSign] = useState("");

  const changeMessageToSign = async (event) => {
    setMessageToSign(event.target.value);
  };

  async function signMessage() {
    let signedMessaged;
    try {
      signedMessaged = await connection.signMessage(messageToSign);
    } catch (error) {
      return;
    }
    console.log(signedMessaged)
  }

  return ([
    <TextInput
      key="messageToSign"
      label="messageToSign"
      value={messageToSign}
      onChange={changeMessageToSign}
      sx={{marginBottom: '5px', marginTop: '5px'}}
    />,
    <Button
      sx={{marginTop: '15px'}}
      onClick={() => {
        signMessage()
      }}
    >
      Sign message
    </Button>
  ]);
}
