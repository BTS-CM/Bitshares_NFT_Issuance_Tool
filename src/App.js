import { useState } from "react";
import { Text, Container, Center, Grid, Col, Paper, Button, Divider } from '@mantine/core'
import { connect, link } from 'beet-js';
import useLocalStorageState from 'use-local-storage-state';

import Upload from "./components/nft/Upload";
import Wizard from "./components/nft/Wizard";
import Offchain from "./components/nft/Offchain";
import DRM from "./components/nft/DRM";
import BeetLink from "./components/nft/BeetLink";
import SelectAsset from "./components/nft/SelectAsset";

import './App.css'

function App() {

  const [nodes, setNodes] = useState();
  const [connection, setConnection] = useState(null);
  const [crypto, setCrypto] = useState();
  const [authenticated, setAuthenticated] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [cdkey, setCDKey] = useState(false);

  const [mode, setMode] = useState();
  const [asset, setAsset] = useState();
  const [images, setImages] = useState();

  const [identity, setIdentity] = useLocalStorageState(
    'beetIdentity', {defaultValue: null}
  );
  const [environment, setEnvironment] = useLocalStorageState(
    'environment', {defaultValue: 'production'}
  );
  const [prodConnection, setProdConnection] = useLocalStorageState(
    'prodNetwork', {defaultValue: "wss://eu.nodes.bitshares.ws"}
  );
  const [testnetConnection, setTestnetConnection] = useLocalStorageState(
    'testNetwork', {defaultValue: "wss://node.testnet.bitshares.eu"}
  );

  let wsURL = environment === 'production'
                ? prodConnection
                : testnetConnection;

  function reset() {
    setConnection();
    setCrypto();
    setAuthenticated();
    setImages();
    setIsLinked(false);
    setIdentity(null);
    setMode();
    setAsset();
    setCDKey();
    setNodes();
  }

  async function connectToBeet() {
    let connected;
    try {
      connected = await connect(
        "NFT Issuance tool",
        "Application",
        "localhost",
        connection ? connection : null,
        connection && connection.identity ? connection.identity : null
      );
    } catch (error) {
      console.error(error)
    }

    if (!connected) {
      console.error("Couldn't connect to Beet");
      //console.log(beetConnection)
      setConnection(null);
      setAuthenticated(null);
      return;
    }

    setConnection(connected);
    setAuthenticated(connected.authenticated);
  }

  let initPrompt;
  let topText;
  let mainPrompt;
  if (!connection) {
    initPrompt = <span>
                    <Button
                      sx={{marginTop: '15px'}}
                      onClick={() => {
                        connectToBeet()
                      }}
                    >
                      Connect to Beet
                    </Button>
                  </span>;
    topText = "This tool is designed for use with the Bitshares BEET Wallet. Launch it then click the button to proceed.";
  } else if (connection && !isLinked) {
    initPrompt = <BeetLink
                    connection={connection}
                    setIsLinked={setIsLinked}
                    setIdentity={setIdentity}
                    setCrypto={setCrypto}
                  />;
    topText = "Connected to Beet wallet successfully. Now proceed to link this app to the Beet wallet below.";
  } else if (!cdkey && isLinked && identity) {
    let userID = identity.requested.account.id;
    initPrompt = <DRM
                    environment={environment}
                    userID={userID}
                    nodes={nodes}
                    setCDKey={setCDKey}
                    setNodes={setNodes}
                    setProdConnection={setProdConnection}
                    setTestnetConnection={setTestnetConnection}
                    setConnection={setConnection}
                    setIsLinked={setIsLinked}
                    setIdentity={setIdentity}
                    setCrypto={setCrypto}
                  />;
    topText = "Checking your Bitshares account for NFT tool eligibility.";
  } else if (!mode) {
    initPrompt = <span>
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
    </span>;
    topText = "Are you creating a new NFT or editing an existing one?";
  } else if (mode === 'edit' && !asset) {
    let userID = identity.requested.account.id;
    initPrompt = <SelectAsset
                    userID={userID}
                    wsURL={wsURL}
                    nodes={nodes}
                    environment={environment}
                    setProdConnection={setProdConnection}
                    setTestnetConnection={setTestnetConnection}
                    setAsset={setAsset}
                    setMode={setMode}
                    setNodes={setNodes}
                  />
    topText = "Made a mistake during issuance? Edit it!";
  } else if (!images) {
    topText = "";
    initPrompt = <Offchain
                    setImages={setImages}
                    setMode={setMode}
                  />
  } else if (images) {
    topText = "Ready to issue NFTs on the Bitshares blockchain!";
    initPrompt = <Wizard
                    connection={connection}
                    images={images}
                    setImages={setImages}
                    wsURL={wsURL}
                    nodes={nodes}
                    setNodes={setNodes}
                    environment={environment}
                    setProdConnection={setProdConnection}
                    setTestnetConnection={setTestnetConnection}
                  />;
  } else {
    topText = "An issue was encountered, reset and try again.";
    initPrompt = <Text size="md">An error ocurred</Text>
  }

  return (
    <div className="App">
      <header className="App-header">
          <Grid key={"about"} grow>
            <Col span={12}>
              <Paper padding="sm" shadow="xs">
                <Text size="lg">
                  Bitshares NFT Issuance tool
                </Text>
                <Text size="md">
                  {topText}
                </Text>
                {
                  initPrompt
                }
                {
                  isLinked
                  ? <span>
                      <Divider></Divider>
                      <Button
                        sx={{marginTop: '15px', marginRight: '5px'}}
                        onClick={() => {
                          openGallery()
                        }}
                      >
                        NFTEA Gallery
                      </Button>
                      <Button
                        sx={{marginTop: '15px', marginBottom: '5px'}}
                        onClick={() => {
                          reset()
                        }}
                      >
                        Reset app
                      </Button>
                    </span>
                  : null
                }
              </Paper>
            </Col>
          </Grid>
      </header>
    </div>
  );
}

export default App
