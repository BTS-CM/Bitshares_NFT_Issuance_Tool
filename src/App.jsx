import { useState, useEffect } from "react";
import { Text, Container, Center, Group, Grid, Col, Paper, Button, Divider, Image } from '@mantine/core'
import { appStore, beetStore, identitiesStore } from './lib/states';

import Environment from "./components/setup/Environment";
import Settings from "./components/setup/Settings";
import AccountMode from "./components/setup/AccountMode";
import Loading from "./components/setup/Loading";
import Offline from "./components/setup/Offline";
import Offchain from "./components/images/Offchain";
import SelectAsset from "./components/blockchain/SelectAsset";
import Wizard from "./components/blockchain/Wizard";

import './App.css'

function openURL() {
  window.electron.openURL('gallery');
}



function App() {

  let environment = appStore((state) => state.environment);
  let setEnvironment = appStore((state) => state.setEnvironment);

  let mode = appStore((state) => state.mode);
  let setMode = appStore((state) => state.setMode);
  
  function openSettings() {
    setMode('settings');
  }

  let account = appStore((state) => state.account);
  let setAccount = appStore((state) => state.setAccount);
  let setAccountType = appStore((state) => state.setAccountType);

  let nodes = appStore((state) => state.nodes);
  let setNodes = appStore((state) => state.setNodes);

  let changing_images = appStore((state) => state.changing_images);
  let asset = appStore((state) => state.asset);
  let asset_images = appStore((state) => state.asset_images);

  let isLinked = beetStore((state) => state.isLinked);
  let identity = beetStore((state) => state.identity);
  let setIdentities = identitiesStore((state) => state.setIdentities);

  let resetApp = appStore((state) => state.reset);
  let resetBeet = beetStore((state) => state.reset);
  let resetNodes = appStore((state) => state.reset);

  function reset() {
    resetApp();
    resetBeet();
  }

  const [loadingNodes, setLoadingNodes] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (environment && (!nodes || !nodes.length)) {
        setLoadingNodes(true);
        console.log('setting nodes')
        try {
          await setNodes();
        } catch (error) {
          console.log(error)
        }
        setLoadingNodes(false);
      }
    }

    fetchData();
  }, [environment, nodes]);

  useEffect(() => {
    if (nodes && nodes.length) {
      console.log({nodes})
      setLoadingNodes(false);
    }
  }, [nodes]);

  useEffect(() => {
    if (isLinked && identity) {
      setIdentities(identity);
    }
  }, [isLinked, identity]);

  let initPrompt;
  if (!environment) {
    initPrompt = <Environment />;
  } else if (loadingNodes) {
    initPrompt = <Loading />
  } else if (!loadingNodes && !nodes || !nodes.length) {
    initPrompt = <Offline />
  } else if (!mode) {
    initPrompt = <AccountMode 
                    backCallback={() => {
                      setMode()
                      setEnvironment()
                      resetNodes()
                      setAccount()
                      setAccountType()
                      resetBeet()
                    }}
                  />
  } else if (mode === 'edit' && !asset) {
    let userID = account ?? identity.requested.account.id;
    initPrompt = <SelectAsset userID={userID} />
  } else if (mode === 'settings') {
    initPrompt = <Settings />
  } else if ((mode === 'create' && !asset_images) || changing_images === true) {
    initPrompt = <Offchain />
  } else if (asset_images) {
    let userID = account ?? identity.requested.account.id;
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
                  environment
                    ? <Button 
                        variant="outline" color="dark"
                        sx={{marginTop: '15px', marginRight: '5px', marginBottom: '5px'}}
                        onClick={() => {
                          openSettings()
                        }}
                      >
                        Settings
                      </Button>
                    : null
                }
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
