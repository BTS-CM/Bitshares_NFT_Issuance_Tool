import { useState } from 'react';

import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

import {
  Button,
  TextInput
} from '@mantine/core';

export default function Vote(properties) {
  let connection = properties.connection;

  const [voteTarget, setVoteTarget] = useState("1.6.35");

  const changeVoteTarget = async (event) => {
    setVoteTarget(event.target.value);
  };

  async function vote() {
    let voteResult;
    try {
      voteResult = await connection.voteFor({id: voteTarget});
    } catch (error) {
      console.log(error);
      return;
    }

    console.log(voteResult);
  }

  return ([
    <TextInput
      key="voteTarget"
      label="voteTarget"
      value={voteTarget}
      onChange={changeVoteTarget}
      sx={{marginBottom: '5px', marginTop: '5px'}}
    />,
    <Button
      sx={{marginTop: '15px'}}
      onClick={() => {
        vote()
      }}
    >
      Cast vote
    </Button>
  ]);
}
