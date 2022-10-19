import create from 'zustand';
import { persist } from 'zustand/middleware';
import { connect, checkBeet, link } from 'beet-js';

import { getImages } from './images';
import { testNodes, fetchIssuedAssets, fetchAssets, fetchDynamicData, fetchUserBalances } from './queries';

/**
 * NFT_Viewer related
 */
const appStore = create(
    (set, get) => ({
      environment: null,
      mode: null,
      nodes: null,
      asset: null,
      account: null,
      accountType: null,
      asset_images: null,
      changing_images: false,
      asset_issuer: null,
      asset_quantity: null,
      assets: null,
      setEnvironment: (env) => set({environment: env}),
      setMode: (mode) => set({mode: mode}),
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
          console.log(error)
        }
  
        if (response) {
          set({ nodes: await response })
        }
      },
      setAsset: async (newAsset) => {
        /**
        * Store an asset & fetch relevant info
        * @param {Object} newAsset
        */
        const node = get().nodes[0];
        let dynamicData;
        try {
          dynamicData = await fetchDynamicData(node, newAsset);
        } catch (error) {
          console.log(error)
          return;
        }

        let description = newAsset
                          && newAsset.options.description
                          && newAsset.options.description.length
                          ? JSON.parse(newAsset.options.description) : undefined;
        let nft_object = description ? description.nft_object : undefined;

        let images;
        try {
          images = await getImages(nft_object)
        } catch (error) {
          console.log(error);
        }

        set({
          asset: newAsset,
          asset_images: images,
          asset_issuer: dynamicData.issuer,
          asset_quantity: dynamicData.quantity
        })
      },
      setAccount: (newAccount) => set({account: newAccount}),
      setAccountType: (newAccountType) => set({accountType: newAccountType}),
      setAssetImages: (images) =>  set({asset_images: images}),
      fetchAssets: async (asset_ids) => {
        /**
         * Looking asset data from an array of IDs
         * @param {Array} asset_ids
         */
        const node = get().nodes[0];
        let response;
        try {
          response = await fetchAssets(node, asset_ids);
        } catch (error) {
          console.log(error)
        }
  
        if (response) {
          set({ assets: await response })
        }
      },
      fetchIssuedAssets: async (accountID) => {
        /**
         * Fetching the assets issued by the provided account ID
         * @param {String} accountID
         */
        const node = get().nodes[0];
        let response;
        try {
          response = await fetchIssuedAssets(node, accountID);
        } catch (error) {
          console.log(error)
        }
        
        if (!response || !response.length) {
          set({ assets: [] })
        }

        let filteredAssets = [];
        for (let i = 0; i < response.length; i++) {
          let asset = response[i];
          let currentDescription = JSON.parse(asset.options.description);
          let nft_object = currentDescription.nft_object;

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
          set({ assets: filteredAssets })
        }
      },
      changeURL: () => {
        /**
         * The current node url isn't healthy anymore
         * shift it to the back of the queue
         */
        console.log('Changing primary node');
        let nodesToChange = get().nodes;
        nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end
        set({ nodes: nodesToChange })
      },
      clearAssets: () => set({
        assets: null
      }),
      removeImages: () => set({
        asset_images: null
      }),
      setChangingImages: (newValue) => set({
        changing_images: newValue
      }),
      back: () => set({
        mode: null,
        asset: null,
        asset_images: null,
        asset_issuer: null,
        asset_quantity: null
      }),
      exitDRM: () => set({
        isLinked
      }),
      reset: () => set({
          environment: null,
          mode: null,
          nodes: null,
          asset: null,
          asset_issuer: null,
          asset_quantity: null,
          asset_order_book: null,
          assets: null
      })
  })
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
        console.log('beet not online')
        return;
      }
  
      let connected;
      try {
        connected = await connect(
          "NFT Issuance Tool",
          "Application",
          "localhost",
          null,
          identity ?? null
        );
      } catch (error) {
        console.error(error)
      }

      let auth = {
        connection: null,
        authenticated: null,
        isLinked: null
      };

      if (!connected) {
        console.error("Couldn't connect to Beet");
        set(auth)
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
      let currentConnection = get().connection;
      let linkage = { isLinked: null, identity: null };

      let linkAttempt;
      try {
        linkAttempt = await link(environment === 'production' ? 'BTS' : 'BTS_TEST', currentConnection);
      } catch (error) {
        console.error(error)
        set(linkage)
        return;
      }

      if (!currentConnection.identity) {
        set(linkage)
        return;
      }

      console.log({id: currentConnection.identity})

      linkage.isLinked = true;
      linkage.identity = currentConnection.identity;
      set(linkage)
    },
    setConnection: (res) => set({connection: res}),
    setAuthenticated: (auth) => set({authenticated: auth}),
    setIsLinked: (link) => set({isLinked: link}),
    setIdentity: (id) => set({identity: id}),
    reset: () => set({
        authenticated: null,
        connection: null,
        isLinked: null,
        identity: null
    })
}));

const identitiesStore = create(
  persist((set, get) => ({
    identities: [],
    setIdentities: (identity) => {
      if (!identity) {
        return;
      }

      let currentIdentities = get().identities;

      if (currentIdentities.find(id => 
        id.identityHash === identity.identityHash
        && id.requested.account.id === identity.requested.account.id
      )) {
        console.log('Account already linked')
        return;
      }
      
      currentIdentities.push(identity);
      set({identities: currentIdentities});
    },
    removeIdentity: (accountID) => {
      if (!accountID) {
        return;
      }
      let currentIdentities = get().identities;
      let newIdentities = currentIdentities.filter(x => x.requested.account.id != accountID);
      set({identities: newIdentities});
    }
  }))
);

export {
    appStore,
    beetStore,
    identitiesStore
};