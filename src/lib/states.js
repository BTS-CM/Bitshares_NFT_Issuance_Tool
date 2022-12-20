import create from 'zustand';
import { persist } from 'zustand/middleware';
import { connect, checkBeet, link } from 'beet-js';

import { getImages } from './images';

import {
  testNodes,
  fetchIssuedAssets,
  fetchAssets,
  fetchDynamicData,
} from './stateQueries';

/**
 * NFT_Viewer related
 */
const appStore = create((set, get) => ({
  environment: null,
  mode: null,
  nodes: null,
  asset: null,
  initialValues: null, // sending draft to wizard
  account: null,
  accountType: null,
  asset_images: null,
  changing_images: false,
  asset_issuer: null,
  asset_quantity: null,
  assets: null,
  setEnvironment: (env) => set({ environment: env }),
  setMode: (mode) => set({ mode }),
  setNodes: async () => {
    /**
     * Testing then storing the bitshares nodes for blockchain queries
     */
    const env = get().environment;
    if (!env) {
      console.log('No env set');
      return;
    }

    let response;
    try {
      response = await testNodes(env === 'production' ? 'BTS' : 'BTS_TEST');
    } catch (error) {
      console.log(error);
    }

    if (response) {
      set({ nodes: await response });
    }
  },
  setInitialValues: (initialValues) => set({ initialValues }),
  setAsset: async (newAsset) => {
    /**
     * Store an asset & fetch relevant info
     * @param {Object} newAsset
     */
    const node = get().nodes[0];
    const changeURLFunc = appStore.getState().changeURL;
    let dynamicData;
    try {
      dynamicData = await fetchDynamicData(node, newAsset, changeURLFunc);
    } catch (error) {
      console.log(error);
      return;
    }

    const description = newAsset
                        && newAsset.options.description
                        && newAsset.options.description.length
      ? JSON.parse(newAsset.options.description)
      : undefined;
    const nft_object = description ? description.nft_object : undefined;

    let images;
    try {
      images = await getImages(nft_object);
    } catch (error) {
      console.log(error);
    }

    set({
      asset: newAsset,
      asset_images: images,
      asset_issuer: dynamicData.issuer,
      asset_quantity: dynamicData.quantity,
    });
  },
  setAccount: (newAccount) => set({ account: newAccount }),
  setAccountType: (newAccountType) => set({ accountType: newAccountType }),
  setAssetImages: (images) => set({ asset_images: images }),
  fetchAssets: async (asset_ids) => {
    /**
     * Looking asset data from an array of IDs
     * @param {Array} asset_ids
     */
    const node = get().nodes[0];
    const changeURLFunc = get().changeURL;
    let response;
    try {
      response = await fetchAssets(node, asset_ids, changeURLFunc);
    } catch (error) {
      console.log(error);
    }

    if (response) {
      set({ assets: await response });
    }
  },
  fetchIssuedAssets: async (accountID) => {
    /**
     * Fetching the assets issued by the provided account ID
     * @param {String} accountID
     */
    const node = get().nodes[0];
    const changeURLFunc = get().changeURL;
    let response;
    try {
      response = await fetchIssuedAssets(node, accountID, changeURLFunc);
    } catch (error) {
      console.log(error);
    }

    if (!response || !response.length) {
      set({ assets: [] });
    }

    const filteredAssets = [];
    for (let i = 0; i < response.length; i++) {
      const asset = response[i];
      const currentDescription = JSON.parse(asset.options.description);
      console.log();
      const { nft_object } = currentDescription;

      let images;
      try {
        images = await getImages(nft_object);
      } catch (error) {
        console.log(error);
        return;
      }

      if (!images || !images.length) {
        continue;
      }

      filteredAssets.push(asset);
    }

    if (filteredAssets.length) {
      set({ assets: filteredAssets });
    }
  },
  changeURL: () => {
    /**
     * The current node url isn't healthy anymore
     * shift it to the back of the queue
     */
    console.log('Changing primary node');
    const nodesToChange = get().nodes;
    nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
    set({ nodes: nodesToChange });
  },
  clearAssets: () => set({
    assets: null,
  }),
  removeImages: () => set({
    asset_images: null,
  }),
  setChangingImages: (newValue) => set({
    changing_images: newValue,
  }),
  back: () => set({
    mode: null,
    asset: null,
    initialValues: null,
    asset_images: null,
    asset_issuer: null,
    asset_quantity: null,
  }),
  reset: () => set({
    environment: null,
    mode: null,
    nodes: null,
    asset: null,
    initialValues: null,
    asset_issuer: null,
    asset_quantity: null,
    asset_order_book: null,
    assets: null,
  }),
}));

/**
 * Beet wallet related
 */
const beetStore = create((set, get) => ({
  connection: null,
  authenticated: null,
  isLinked: null,
  identity: null,
  connect: async (identity) => {
    /**
     * Connect to and authenticate with the Beet client
     * @param {Object} identity
     */
    let beetOnline;
    try {
      beetOnline = await checkBeet(true);
    } catch (error) {
      console.log(error);
    }

    if (!beetOnline) {
      console.log('beet not online');
      return;
    }

    let connected;
    try {
      connected = await connect(
        'NFT Issuance Tool',
        'Application',
        'localhost',
        null,
        identity ?? null,
      );
    } catch (error) {
      console.error(error);
    }

    const auth = {
      connection: null,
      authenticated: null,
      isLinked: null,
    };

    if (!connected) {
      console.error("Couldn't connect to Beet");
      set(auth);
      return;
    }

    auth.connection = connected;
    auth.authenticated = connected.authenticated;

    set(auth);
  },
  link: async (environment) => {
    /**
     * Re/Link to Beet wallet
     * @param {String} environment
     */
    const currentConnection = get().connection;
    const linkage = { isLinked: null, identity: null };

    let linkAttempt;
    try {
      linkAttempt = await link(
        environment === 'production' ? 'BTS' : 'BTS_TEST',
        currentConnection,
      );
    } catch (error) {
      console.error(error);
      set(linkage);
      return;
    }

    if (!currentConnection.identity) {
      set(linkage);
      return;
    }

    console.log({ id: currentConnection.identity });

    linkage.isLinked = true;
    linkage.identity = currentConnection.identity;
    set(linkage);
  },
  setConnection: (res) => set({ connection: res }),
  setAuthenticated: (auth) => set({ authenticated: auth }),
  setIsLinked: (newLink) => set({ isLinked: newLink }),
  setIdentity: (id) => set({ identity: id }),
  reset: () => set({
    authenticated: null,
    connection: null,
    isLinked: null,
    identity: null,
  }),
}));

const identitiesStore = create(
  persist((set, get) => ({
    identities: [],
    drafts: [],
    setIdentities: (identity) => {
      if (!identity) {
        return;
      }

      const currentIdentities = get().identities;

      if (
        currentIdentities.find(
          (id) => id.identityHash === identity.identityHash
            && id.requested.account.id === identity.requested.account.id,
        )
      ) {
        console.log('Account already linked');
        return;
      }

      currentIdentities.push(identity);
      set({ identities: currentIdentities });
    },
    removeIdentity: (accountID) => {
      if (!accountID) {
        return;
      }
      const currentIdentities = get().identities;
      const newIdentities = currentIdentities.filter((x) => x.requested.account.id !== accountID);
      set({ identities: newIdentities });
    },
    setDrafts: (values, asset_images) => {
      const currentDrafts = get().drafts;

      // search through currentDrafts for a draft with the same accountID in jsonData
      const draftIndex = currentDrafts.findIndex((draft) => draft.values.symbol === values.symbol);
      if (draftIndex !== -1) {
        // if found, replace the draft with the new one
        currentDrafts[draftIndex] = { values, asset_images };
        set({ drafts: currentDrafts });
        console.log('Draft updated');
        return;
      }

      const newDrafts = [...currentDrafts, { values, asset_images }];
      console.log('Draft saved');
      set({ drafts: newDrafts });
    },
    eraseDraft: (symbol) => {
      const currentDrafts = get().drafts;
      const newDrafts = currentDrafts.filter((draft) => draft.values.symbol !== symbol);
      set({ drafts: newDrafts });
    },
  })),
);

export { appStore, beetStore, identitiesStore };
