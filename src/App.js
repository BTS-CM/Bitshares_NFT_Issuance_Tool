import { useState } from "react";
import { Text, Container, Center, Grid, Col, Paper, Button, Divider } from '@mantine/core'
import { connect, link } from 'beet-js';
import useLocalStorageState from 'use-local-storage-state';

import Upload from "./components/nft/Upload";
import Wizard from "./components/nft/Wizard";
import Offchain from "./components/nft/Offchain";
import DRM from "./components/nft/DRM";
import SelectAsset from "./components/nft/SelectAsset";

import './App.css'

function App() {

  const [connection, setConnection] = useState(null);
  const [crypto, setCrypto] = useState();
  const [authenticated, setAuthenticated] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const [cdkey, setCDKey] = useState(false);

  const [onchain, setOnchain] = useState();
  const [IPFS, setIPFS] = useState();
  const [image, setImage] = useState();
  const [images, setImages] = useState();
  
  const [mode, setMode] = useState();
  const [asset, setAsset] = useState();

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
    setImage();
    setImages();
    setIsLinked(false);
    setIdentity(null);
    setMode();
    setAsset();
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
      setConnection(null);
      return;
    }

    setConnection(connected);
    setAuthenticated(connected.authenticated);
  }

  /*
   * After connection attempt to link app to Beet client
   */
  async function linkToBeet(target = "BTS") {
    if (!connection) {
      console.log("Missing Beet connection");
      return;
    }

    let linkAttempt;
    try {
      linkAttempt = await link(target, connection);
    } catch (error) {
      console.error(error)
      return;
    }

    if (connection.secret) {
      console.log('Successfully linked')
      setIsLinked(true);
      setIdentity(connection.identity);
      setCrypto(target)
    }
  }

  let initPrompt;
  let topText;
  let mainPrompt;
  if (!connection) {
    initPrompt = <span><Button
                    sx={{marginTop: '15px'}}
                    onClick={() => {
                      connectToBeet()
                    }}
                  >
                    Connect to Beet
                  </Button></span>;
    topText = "This tool is designed for use with the Bitshares BEET Wallet. Launch it then click the button to proceed.";
  } else if (connection && !isLinked) {
    initPrompt = <span>
      <Button
        sx={{marginTop: '15px', marginRight: '5px'}}
        onClick={() => {
          linkToBeet('BTS')
        }}
      >
        Link to production Bitshares
      </Button>
      <Button
        sx={{marginTop: '15px'}}
        onClick={() => {
          linkToBeet('BTS_TEST')
        }}
      >
        Link to testnet Bitshares
      </Button>
    </span>;
    topText = "Connected to Beet wallet successfully. Now proceed to link this app to the Beet wallet below.";
  } else if (!cdkey && isLinked && identity && crypto === "BTS") {
    let userID = identity.requested.account.id;
    initPrompt = <DRM setCDKey={setCDKey} userID={userID} />;
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
    initPrompt = <SelectAsset setAsset={setAsset} userID={userID} setMode={setMode} />
    topText = "Made a mistake during issuance? Edit it!";
  } else if (!onchain && !IPFS) {
    initPrompt = <span>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px', marginLeft: '5px'}}
                    onClick={() => {
                      setIPFS(false);
                      setOnchain(true)
                    }}
                  >
                    Onchain image storage
                  </Button>
                  <Button
                    sx={{marginTop: '15px', marginRight: '5px'}}
                    onClick={() => {
                      setIPFS(true);
                      setOnchain(false);
                    }}
                  >
                    IPFS image storage
                  </Button>
                </span>;
    topText = "Are you storing the image onchain or on IPFS?";
  } else if (IPFS && !image) {
    topText = "";
    initPrompt = <Offchain setImage={setImage} setImages={setImages} setIPFS={setIPFS} /> // 
  } else if (onchain && !image) {
    topText = "Upload an image, it will be converted to base64 and stored onchain.";
    initPrompt = <Upload setImage={setImage} setOnchain={setOnchain} />
  } else if (onchain || IPFS && image) {
    topText = "Ready to issue NFTs on the Bitshares blockchain!";
    initPrompt = <Wizard
                    connection={connection}
                    image={image}
                    setImage={setImage}
                    images={images}
                    setImages={setImages}
                    setOnchain={setOnchain}
                    setIPFS={setIPFS}
                    onchain={onchain}
                    IPFS={IPFS}
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
