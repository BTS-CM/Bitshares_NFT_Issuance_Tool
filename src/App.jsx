import { useState } from "react";
import { Text, Container, Center, Group, Grid, Col, Paper, Button, Divider, Image } from '@mantine/core'
import { appStore, beetStore, identitiesStore } from './lib/states';

import Connect from "./components/beet/Connect";
import BeetLink from "./components/beet/BeetLink";
import DRM from "./components/setup/DRM";
import Environment from "./components/setup/Environment";
import Mode from "./components/setup/Mode";
import Offchain from "./components/images/Offchain";
import SelectAsset from "./components/blockchain/SelectAsset";
import Wizard from "./components/blockchain/Wizard";

import './App.css'

function openURL() {
  window.electron.openURL('gallery');
}

function App() {

  let environment = appStore((state) => state.environment);
  let mode = appStore((state) => state.mode);
  let setNodes = appStore((state) => state.setNodes);
  let cdkey = appStore((state) => state.cdkey);
  let changing_images = appStore((state) => state.changing_images);
  let asset = appStore((state) => state.asset);
  let asset_images = appStore((state) => state.asset_images);

  let connection = beetStore((state) => state.connection);
  let authenticated = beetStore((state) => state.authenticated);
  let isLinked = beetStore((state) => state.isLinked);
  let identity = beetStore((state) => state.identity);
  let setIdentities = identitiesStore((state) => state.setIdentities);

  let resetApp = appStore((state) => state.reset);
  let resetBeet = beetStore((state) => state.reset);

  function reset() {
    resetApp();
    resetBeet();
  }

  let initPrompt;
  if (!environment) {
    initPrompt = <Environment />;
  } else if (!connection) {
    setNodes();
    initPrompt = <Connect />;
  } else if (connection && authenticated && !isLinked) {
    initPrompt = <BeetLink />;
  } else if (!cdkey && isLinked && identity) {
    let userID = identity.requested.account.id;
    setIdentities(identity);
    initPrompt = <DRM userID={userID} />;
  } else if (!mode) {
    initPrompt = <Mode />;
  } else if (mode === 'edit' && !asset) {
    let userID = identity.requested.account.id;
    initPrompt = <SelectAsset userID={userID} />
  } else if (!asset_images || changing_images === true) {
    initPrompt = <Offchain />
  } else if (asset_images) {
    let userID = identity.requested.account.id;
    initPrompt = <Wizard userID={userID} />
  } else {
    initPrompt = <Text size="md">An issue was encountered, reset and try again.</Text>
  }

  let caption;
  if (environment) {
    caption = environment === 'production' ? 'Bitshares' : 'Testnet BTS';
  }

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key={"about"} grow>
            <Col span={12}>
              <div style={{ width: 350, marginLeft: 'auto', marginRight: 'auto' }}>
                <Image
                  radius="md"
                  src="./logo2.png"
                  alt="Bitshares logo"
                  caption={`${caption ?? ''} NFT Issuance tool`}
                />
              </div>
            </Col>
            
            {
              initPrompt
            }

            <Col span={12}>
              <span>
                <Divider></Divider>
                <Button 
                  variant="default" color="dark"
                  sx={{marginTop: '15px', marginRight: '5px'}}
                  onClick={() => {
                    openURL()
                  }}
                >
                  NFTEA Gallery
                </Button>
                {
                  isLinked
                  ? <Button 
                      variant="outline" color="dark"
                      sx={{marginTop: '15px', marginBottom: '5px'}}
                      onClick={() => {
                        reset()
                      }}
                    >
                      Reset app
                    </Button>
                  : null
                }
              </span>
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App
