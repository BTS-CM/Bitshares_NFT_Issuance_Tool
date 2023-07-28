import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connect, checkBeet, link } from 'beet-js';

import { getImages } from './images';

import {
  testNodes,
  fetchIssuedAssets,
  fetchAssets,
  fetchDynamicData,
} from './stateQueries';

import config from '../config/config.json';

const localePreferenceStore = create(
  persist(
    (set, get) => ({
      locale: 'en',
      changeLocale: (lng) => {
        console.log(`Saving preferred locale: ${lng}`);
        set({ locale: lng });
      },
    }),
    {
      name: 'localePreference',
    },
  ),
);

const identitiesStore = create(
  persist(
    (set, get) => ({
      identities: [],
      drafts: [],
      storedConnections: {},
      storeConnection: (connection) => {
        if (!connection || !connection.identity) {
          return;
        }
        const currentConnections = get().storedConnections;
        if (!currentConnections || !currentConnections[connection.identity.identityhash]) {
          currentConnections[connection.identity.identityhash] = {
            beetkey: connection.beetkey,
            next_identification: connection.next_identification,
            secret: connection.secret,
          };
          set({ storedConnections: currentConnections });
        }
      },
      removeConnection: (identityhash) => {
        const currentConnections = get().storedConnections;
        if (currentConnections && currentConnections[identityhash]) {
          delete currentConnections[identityhash];
          set({ storedConnections: currentConnections });
        }
      },
      setIdentities: (newIdentity) => {
        if (!newIdentity) {
          console.log("No identity provided");
          return;
        }

        let currentIdentities = get().identities;
        if (
          currentIdentities
          && currentIdentities.length
          && currentIdentities.find(
            (existingIdentity) => existingIdentity.identityHash === newIdentity.identityHash
              && existingIdentity.requested.account.id === newIdentity.requested.account.id,
          )
        ) {
          console.log('using existing identity');
          return;
        }

        if (!currentIdentities || !currentIdentities.length) {
          set({ identities: [newIdentity] });
        } else {
          currentIdentities = [...currentIdentities, newIdentity];
          set({ identities: currentIdentities });
        }
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
        const draftIndex = currentDrafts.findIndex(
          (draft) => draft.values.symbol === values.symbol,
        );
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
    }),
    {
      name: 'beetIdentities',
    },
  ),
);

/**
 * Global app settings
 */
const appStore = create(
  persist(
    (set, get) => ({
      environment: null,
      nodes: {
        bitshares: config.bitshares.nodeList.map((node) => node.url),
        bitshares_testnet: config.bitshares_testnet.nodeList.map((node) => node.url),
      },
      setEnvironment: (env) => set({ environment: env }),
      setNodes: async () => {
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
      changeURL: (env) => {
      /**
       * The current node url isn't healthy anymore
       * shift it to the back of the queue
       * Replaces nodeFailureCallback
       */
        console.log('Changing primary node');
        const nodesToChange = get().nodes[env];
        nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end

        if (env === 'bitshares') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares: nodesToChange },
          }));
        } else if (env === 'bitshares_testnet') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }));
        } else if (env === 'tusc') {
          set(async (state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }));
        }
      },
      removeURL: (env, url) => {
        let nodesToChange = get().nodes[env];
        nodesToChange = nodesToChange.filter((x) => x !== url);

        if (env === 'bitshares') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares: nodesToChange },
          }));
        } else if (env === 'bitshares_testnet') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }));
        } else if (env === 'tusc') {
          set((state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }));
        }
      },
      reset: () => set({
        environment: null,
        nodes: {
          bitshares: config.bitshares.nodeList.map((node) => node.url),
          bitshares_testnet: config.bitshares_testnet.nodeList.map((node) => node.url),
        },
      }),
    }),
    {
      name: 'nodeStorage',
    },
  ),
);

/**
 * Temporary store for the NFT Issuance Tool
 */
const tempStore = create(
  (set, get) => ({
    account: "",
    accountType: null,
    asset: null,
    assets: null,
    asset_images: null,
    initialValues: null,
    changing_images: false,
    memo: null,
    asset_issuer: null,
    asset_quantity: null,
    setAccount: (newAccount) => set({ account: newAccount }),
    setInitialValues: (initialValues) => set({ initialValues }),
    chosenAccountMemo: (newMemo) => set({ memo: newMemo }),
    setAssetImages: (images) => set({ asset_images: images }),
    setChangingImages: (newValue) => set({
      changing_images: newValue,
    }),
    setAccountType: (type) => set({ accountType: type }),
    removeImages: () => set({
      asset_images: null,
    }),
    setAsset: async (newAsset) => {
      /**
       * Store an asset & fetch relevant info
       * @param {Object} newAsset
       */
      const { environment, nodes, changeURL } = appStore.getState();
      const node = nodes[environment][0];
      let dynamicData;
      try {
        dynamicData = await fetchDynamicData(node, newAsset, changeURL);
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
        asset_images: images ?? [],
        asset_issuer: dynamicData.issuer,
        asset_quantity: dynamicData.quantity,
      });
    },
    eraseAsset: () => set({
      asset: null,
      asset_images: null,
      asset_issuer: null,
      asset_quantity: null,
    }),
    clearAssets: () => set({
      assets: null,
      nonNFTs: null,
    }),
    fetchAssets: async (asset_ids) => {
      /**
       * Looking asset data from an array of IDs
       * @param {Array} asset_ids
       */
      const { environment, nodes, changeURL } = appStore.getState();
      const node = nodes[environment][0];
      let response;
      try {
        response = await fetchAssets(node, asset_ids, changeURL);
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
      const { environment, nodes, changeURL } = appStore.getState();
      const node = nodes[environment][0];
      let response;
      try {
        response = await fetchIssuedAssets(node, accountID, changeURL);
      } catch (error) {
        console.log(error);
      }

      if (!response || !response.length) {
        set({ assets: [] });
        return;
      }

      const normalAssets = [];
      const filteredAssets = [];
      for (let i = 0; i < response.length; i++) {
        const asset = response[i];
        const currentDescription = JSON.parse(asset.options.description);
        const nft_object = currentDescription.nft_object ?? null;

        if (!nft_object) {
          normalAssets.push(asset);
          continue;
        }

        filteredAssets.push(asset);
      }

      if (filteredAssets.length) {
        set({ assets: filteredAssets });
      }

      if (normalAssets.length) {
        set({ nonNFTs: normalAssets });
      }
    },
    reset: () => set({
      account: "",
      accountType: null,
      asset: null,
      assets: null,
      asset_images: null,
      initialValues: null,
      changing_images: false,
      memo: null,
      asset_issuer: null,
      asset_quantity: null,
    }),
  }),
);

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

    if (!connected) {
      console.error("Couldn't connect to Beet");
      set({
        connection: null,
        authenticated: null,
        isLinked: null,
      });
      return;
    }

    if (identity && identity.identityhash) {
      const { storedConnections } = identitiesStore.getState();

      const storedConnection = storedConnections[identity.identityhash];
      if (storedConnection) {
        connected.beetkey = storedConnection.beetkey;
        connected.next_identification = storedConnection.next_identification;
        connected.secret = storedConnection.secret;
        connected.id = storedConnection.next_identification;
        console.log('updated connected');
        const { setAccountType } = tempStore.getState();
        setAccountType("BEET");
        set({
          connection: connected,
          authenticated: true,
          isLinked: true,
        });
        return;
      }
    }

    set({
      connection: connected,
      authenticated: connected.authenticated,
      isLinked: identity ? true : null,
    });
  },
  link: async (environment) => {
    /**
     * Link to Beet wallet
     * @param {String} environment
     */
    const currentConnection = get().connection;

    let linkAttempt;
    try {
      linkAttempt = await link(
        environment === 'bitshares' ? 'BTS' : 'BTS_TEST',
        currentConnection,
      );
    } catch (error) {
      console.error(error);
      set({ isLinked: null, identity: null });
      return;
    }

    if (!currentConnection.identity) {
      set({ isLinked: null, identity: null });
      return;
    }

    const { storeConnection } = identitiesStore.getState();

    try {
      storeConnection(currentConnection);
    } catch (error) {
      console.log(error);
    }

    const { setAccount, setAccountType } = tempStore.getState();
    try {
      setAccount(currentConnection.identity.requested.account.id);
    } catch (error) {
      console.log(error);
    }

    setAccountType("BEET");

    set({ isLinked: true, identity: currentConnection.identity });
  },
  relink: async (environment) => {
    /**
     * Relink to Beet wallet
     * @param {String} environment
     */
    const currentConnection = get().connection;

    let linkAttempt;
    try {
      linkAttempt = await link(
        environment === 'bitshares' ? 'BTS' : 'BTS_TEST',
        currentConnection,
      );
    } catch (error) {
      console.error(error);
      return;
    }

    set({ connection: currentConnection, isLinked: true });
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

export {
  appStore, beetStore, identitiesStore, localePreferenceStore, tempStore,
};
