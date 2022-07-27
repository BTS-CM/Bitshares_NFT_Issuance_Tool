import { useState } from "react";
import { Text, Container, Center, Group, Grid, Col, Paper, Button, Divider } from '@mantine/core'
import { connect, link } from 'beet-js';
import useLocalStorageState from 'use-local-storage-state';

import Connect from "./components/Connect";
import BeetLink from "./components/BeetLink";
import DRM from "./components/DRM";
import Mode from "./components/Mode";
import Offchain from "./components/Offchain";
//import Upload from "./components/Upload";
import SelectAsset from "./components/SelectAsset";
import Wizard from "./components/Wizard";

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
  const [changingImages, setChangingImages] = useState(false);

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

  let initPrompt;
  if (!connection) {
    initPrompt = <Connect
                    connection={connection}
                    setConnection={setConnection}
                    setAuthenticated={setAuthenticated}
                  />;
  } else if (connection && authenticated && !isLinked) {
    initPrompt = <BeetLink
                    connection={connection}
                    setIsLinked={setIsLinked}
                    setIdentity={setIdentity}
                    setCrypto={setCrypto}
                  />;
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
  } else if (!mode) {
    initPrompt = <Mode setMode={setMode} />;
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
                    setImages={setImages}
                  />
  } else if (!images || changingImages === true) {
    initPrompt = <Offchain
                    images={images}
                    setImages={setImages}
                    setMode={setMode}
                    changingImages={changingImages}
                    setChangingImages={setChangingImages}
                  />
  } else if (images) {
    let userID = identity.requested.account.id;
    initPrompt = <Wizard
                    connection={connection}
                    userID={userID}
                    asset={asset}
                    images={images}
                    setImages={setImages}
                    setAsset={setAsset}
                    setMode={setMode}
                    setChangingImages={setChangingImages}
                    wsURL={wsURL}
                    nodes={nodes}
                    setNodes={setNodes}
                    environment={environment}
                    setProdConnection={setProdConnection}
                    setTestnetConnection={setTestnetConnection}
                  />;
  } else {
    initPrompt = <Text size="md">An issue was encountered, reset and try again.</Text>
  }

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key={"about"} grow>
            <Col span={12}>
              <Text size="lg">
                Bitshares NFT Issuance tool
              </Text>
            </Col>
            
            {
              initPrompt
            }

            <Col span={12}>
            {
                  isLinked
                  ? <span>
                      <Divider></Divider>
                      <Button 
                        variant="default" color="dark"
                        sx={{marginTop: '15px', marginRight: '5px'}}
                        onClick={() => {
                          openGallery()
                        }}
                      >
                        NFTEA Gallery
                      </Button>
                      <Button 
                        variant="outline" color="dark"
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
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App
