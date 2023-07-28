import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Col,
  Button,
  Divider,
  Image,
  Menu,
  ScrollArea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  Link,
  Routes,
  Route,
} from 'react-router-dom';

import {
  HiOutlineQuestionMarkCircle,
  HiOutlineHome,
  HiWifi,
  HiOutlineIdentification,
  HiOutlineDocumentAdd,
  HiOutlineUserAdd,
  HiOutlineScissors,
  HiOutlinePlus,
  HiOutlineWifi,
} from "react-icons/hi";

import {
  appStore,
  beetStore,
  identitiesStore,
  localePreferenceStore,
} from './lib/states';

import Home from "./pages/Home";
import Upgrade from './pages/Upgrade';
import Faq from './pages/Faq';
import Nodes from './pages/Nodes';
import Create from './pages/Create';
import Edit from './pages/Edit';
import Load from './pages/Load';
import Issue from './pages/Issue';

import './App.css';

/**
 * Tell electron to open a pre-approved external URL
 * @param {String} loc
 */
function openURL(loc) {
  if (['gallery', 'viewer', 'airdrop', 'beet'].includes(loc)) {
    window.electron.openURL(loc);
  }
}

function App() {
  const { t, i18n } = useTranslation();

  const environment = appStore((state) => state.environment);

  const resetApp = appStore((state) => state.reset);
  const resetBeet = beetStore((state) => state.reset);
  const identity = beetStore((state) => state.identity);
  const isLinked = beetStore((state) => state.isLinked);

  const setIdentities = identitiesStore((state) => state.setIdentities);

  const changeLocale = localePreferenceStore((state) => state.changeLocale);
  const locale = localePreferenceStore((state) => state.locale);

  function reset() {
    resetApp();
    resetBeet();
  }

  useEffect(() => {
    if (isLinked && identity) {
      setIdentities(identity);
    }
  }, [isLinked, identity]);

  /**
   * Set the i18n locale
   * @param {String} newLocale
   */
  function setLanguage(newLocale) {
    try {
      i18n.changeLanguage(newLocale);
    } catch (error) {
      console.log(error);
      return;
    }

    try {
      changeLocale(newLocale);
    } catch (error) {
      console.log(error);
    }
  }

  let caption;
  if (environment) {
    caption = environment === 'bitshares' ? 'Bitshares' : 'Testnet BTS';
  }

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'da', label: 'Dansk' },
    { value: 'de', label: 'Deutsche' },
    { value: 'et', label: 'Eesti' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'pt', label: 'Português' },
    { value: 'th', label: 'ไทย' },
  ];

  const localeItems = languages.map((lang) => (
    <Menu.Item key={`lang_${lang.value}`} onClick={() => setLanguage(lang.value)}>
      { lang.label }
    </Menu.Item>
  ));

  /*
  {isLinked ? (
    <Button
      variant="outline"
      color="dark"
      sx={{ marginTop: '15px', marginBottom: '5px' }}
      onClick={() => {
        reset();
      }}
    >
      {t('setup:app.reset')}
    </Button>
  ) : null}
  */

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key="about" grow>
            <Col mt="xl" ta="left" span={1}>
              <Menu shadow="md" width={200} position="right-start">
                <Menu.Target>
                  <Button>
                    {t("app:menu.btn")}
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{t("app:menu.label")}</Menu.Label>
                  <Link style={{ textDecoration: 'none' }} to="/">
                    <Menu.Item icon={<HiOutlineHome />}>
                      {t("app:menu.home")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./createNFT/create">
                    <Menu.Item icon={<HiOutlinePlus />}>
                      {t("app:menu.createNFT")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./editNFT">
                    <Menu.Item icon={<HiOutlineScissors />}>
                      {t("app:menu.editNFT")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./load">
                    <Menu.Item icon={<HiOutlineDocumentAdd />}>
                      {t("app:menu.loadDraft")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./issueNFT">
                    <Menu.Item icon={<HiOutlineUserAdd />}>
                      {t("app:menu.issueNFT")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./upgrade">
                    <Menu.Item icon={<HiOutlineIdentification />}>
                      {t("app:menu.upgradeAccount")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./faq">
                    <Menu.Item icon={<HiOutlineQuestionMarkCircle />}>
                      {t("app:menu.faq")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./nodes">
                    <Menu.Item icon={<HiWifi />}>
                      {t("app:menu.changeNodes")}
                    </Menu.Item>
                  </Link>
                </Menu.Dropdown>
              </Menu>
              <br />
              <Menu shadow="md" mt="sm" width={200} position="right-start">
                <Menu.Target>
                  <Button compact>
                    { languages.find((x) => x.value === locale).label }
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <ScrollArea h={200}>
                    { localeItems }
                  </ScrollArea>
                </Menu.Dropdown>
              </Menu>
            </Col>
            <Col ta="Center" span={9}>
              <div style={{ width: 350, marginLeft: 'auto', marginRight: 'auto' }}>
                <Image
                  radius="md"
                  src="/logo2.png"
                  alt="Bitshares logo"
                  caption={`${caption ?? ''} NFT Issuance tool`}
                />
              </div>
            </Col>

            <Col span={12}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/createNFT/:mode" element={<Create />} />
                <Route path="/editNFT" element={<Edit />} />
                <Route path="/load" element={<Load />} />
                <Route path="/issueNFT" element={<Issue />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/nodes" element={<Nodes />} />
              </Routes>
            </Col>

            <Col span={12}>
              <span>
                <Divider />
                <Button
                  variant="default"
                  color="dark"
                  sx={{ marginTop: '15px', marginRight: '5px' }}
                  onClick={() => {
                    openURL('gallery');
                  }}
                >
                  NFTEA Gallery
                </Button>
                <Button
                  variant="default"
                  color="dark"
                  sx={{ marginTop: '15px', marginRight: '5px' }}
                  onClick={() => {
                    openURL('beet');
                  }}
                >
                  BEET wallet
                </Button>
                <Button
                  variant="default"
                  color="dark"
                  sx={{ marginTop: '15px', marginRight: '5px' }}
                  onClick={() => {
                    openURL('airdrop');
                  }}
                >
                  Airdrop Tool
                </Button>
                <Button
                  variant="default"
                  color="dark"
                  sx={{ marginTop: '15px', marginRight: '5px' }}
                  onClick={() => {
                    openURL('viewer');
                  }}
                >
                  NFT Viewer
                </Button>
              </span>
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App;
