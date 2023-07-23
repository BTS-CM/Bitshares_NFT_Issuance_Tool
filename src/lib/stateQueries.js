import { Apis } from 'bitsharesjs-ws';
import config from '../config/config.json';

const _nodes = {
  BTS: config.bitshares.nodeList.map((node) => node.url),
  BTS_TEST: config.bitshares_testnet.nodeList.map((node) => node.url),
};

/**
 * Test the wss nodes, return latencies and fastest url.
 * @returns {Promise}
 */
async function testNodes(target, itr = 0) {
  return new Promise(async (resolve, reject) => {
    const urlPromises = _nodes[target].map(
      (url) => window.electron.testConnection(url, itr > 0 ? itr * 3000 : 3000),
    );
    Promise.all(urlPromises)
      .then((validNodes) => {
        const filteredNodes = validNodes.filter((x) => x);
        if (filteredNodes.length) {
          const sortedNodes = filteredNodes.sort((a, b) => a.lag - b.lag).map((node) => node.url);
          return resolve(sortedNodes);
        }
        if (itr > 2) {
          console.error(
            'No valid BTS WSS connections established; Please check your internet connection.',
          );
          reject();
        }
        console.log(
          "Couldn't establish network connections; trying again with greater timeout durations. Apologies for the delay.",
        );
        return resolve(testNodes(target, itr + 1));
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

/**
 * Lookup asset details, return NFTs
 * @param {Apis} api
 * @param {Array} asset_ids
 * @param {Boolean} nonNFT
 */
async function lookup_asset_symbols(api, asset_ids, nonNFT = false) {
  return new Promise(async (resolve, reject) => {
    let symbols;
    try {
      symbols = await api.instance().db_api().exec('lookup_asset_symbols', [asset_ids]);
    } catch (error) {
      console.log(error);
      reject();
    }

    const filteredSymbols = symbols.filter((x) => x !== null);
    resolve(!filteredSymbols || !filteredSymbols.length ? [] : filteredSymbols);
  });
}

/**
 * Fetch asset info for multiple assets
 * @param {String} node
 * @param {Array} asset_ids
 * @param {Boolean} nonNFT
 */
async function fetchAssets(node, asset_ids, changeURL, nonNFT = false) {
  return new Promise(async (resolve, reject) => {
    try {
      await Apis.instance(node, true).init_promise;
    } catch (error) {
      console.log(error);
      changeURL();
      reject();
    }

    let response;
    try {
      response = await lookup_asset_symbols(Apis, asset_ids, nonNFT);
    } catch (error) {
      console.log(error);
      reject();
    }

    resolve(response);
  });
}

/**
 * Fetch any NFTs the user has created
 * @param {String} accountID
 */
async function fetchIssuedAssets(node, accountID, changeURL) {
  return new Promise(async (resolve, reject) => {
    try {
      await Apis.instance(node, true).init_promise;
    } catch (error) {
      console.log(error);
      changeURL();
      reject(error);
    }

    let fullAccounts;
    try {
      fullAccounts = await Apis.instance()
        .db_api()
        .exec('get_full_accounts', [[accountID], true]);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    const accountAssets = fullAccounts[0][1].assets;

    let response;
    try {
      response = await lookup_asset_symbols(Apis, accountAssets);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    resolve(response);
  });
}

/**
 * Retrieve the object contents
 * @param {String} node
 * @param {Object} asset
 * @returns
 */
async function fetchDynamicData(node, asset, changeURL) {
  return new Promise(async (resolve, reject) => {
    try {
      await Apis.instance(node, true).init_promise;
    } catch (error) {
      console.log(error);
      changeURL();
      reject();
    }

    const issuerID = asset.issuer;
    let issuerObject;
    try {
      issuerObject = await Apis.instance()
        .db_api()
        .exec('get_objects', [[issuerID]]);
    } catch (error) {
      console.log(error);
    }

    const dynamicDataID = asset ? asset.dynamic_asset_data_id : null;
    let dynamicData;
    try {
      dynamicData = await Apis.instance()
        .db_api()
        .exec('get_objects', [[dynamicDataID]]);
    } catch (error) {
      console.log(error);
    }

    resolve({
      issuer: issuerObject && issuerObject.length ? issuerObject[0].name : '???',
      quantity: dynamicData && dynamicData.length ? dynamicData[0].current_supply : '???',
    });
  });
}

export {
  testNodes,
  fetchIssuedAssets,
  fetchAssets,
  fetchDynamicData,
};
