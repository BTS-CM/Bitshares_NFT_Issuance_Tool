import config from '../config/config.json';
import {Apis} from "bitsharesjs-ws";
import { appStore } from './states';

const _nodes = {
    BTS: config.BTS.nodeList.map(node => node.url),
    BTS_TEST: config.BTS_TEST.nodeList.map(node => node.url)
};

/**
 * Test the wss nodes, return latencies and fastest url.
 * @returns {Promise}
 */
 async function testNodes(target, itr = 0) {
    return new Promise(async (resolve, reject) => {
        let urlPromises = _nodes[target].map(url => window.electron.testConnection(url, itr > 0 ? itr * 3000 : 3000))
        return Promise.all(urlPromises)
        .then((validNodes) => {
            let filteredNodes = validNodes.filter(x => x);
            if (filteredNodes.length) {
                let sortedNodes = filteredNodes.sort((a, b) => a.lag - b.lag).map(node => node.url);
                return resolve(sortedNodes);
            } else {
                if (itr > 2) {
                    console.error("No valid BTS WSS connections established; Please check your internet connection.")
                    return reject();
                }
                console.log("Couldn't establish network connections; trying again with greater timeout durations. Apologies for the delay.")
                return resolve(testNodes(target, itr + 1));
            }
        })
        .catch(error => {
            console.log(error);
        })
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
            symbols = await api.instance().db_api().exec( "lookup_asset_symbols", [ asset_ids ]);
        } catch (error) {
            console.log(error);
            return reject();
        }

        symbols = symbols.filter(x => x !== null);
        if (!symbols || !symbols.length) {
            return resolve([]);
        }

        if (nonNFT) {
            return resolve(symbols);
        }

        let filteredAssets = symbols.filter(asset => {
            if (!asset.options.description || !asset.options.description.length) {
                return false;
            }
            let desc = JSON.parse(asset.options.description);
            return desc.nft_object ? true : false;
        })

        return resolve(filteredAssets);
    });
}

/**
 * Fetch asset info for multiple assets
 * @param {String} node
 * @param {Array} asset_ids 
 * @param {Boolean} nonNFT 
 */
 async function fetchAssets(node, asset_ids, nonNFT = false) {
    return new Promise(async (resolve, reject) => {
        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        let response;
        try {
            response = await lookup_asset_symbols(Apis, asset_ids, nonNFT);
        } catch (error) {
            console.log(error);
            return reject();
        }

        return resolve(response);
    });
}

/**
 * Search for an account, given 1.2.x or an account name.
 * @param {String} node 
 * @param {String} search_string
 * @returns 
 */
 async function accountSearch(node, search_string) {
    return new Promise(async (resolve, reject) => {

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        let object;
        try {
            object = await Apis.instance().db_api().exec("get_accounts", [[search_string]])
        } catch (error) {
            console.log(error);
            return reject();
        }

        return resolve(object);
    });
}

/**
 * Fetch any NFTs the user has created
 * @param {String} accountID 
 */
async function fetchIssuedAssets(node, accountID) {
    return new Promise(async (resolve, reject) => {

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject(error);
        }

        let fullAccounts;
        try {
            fullAccounts = await Apis.instance().db_api().exec("get_full_accounts", [[accountID], true])
        } catch (error) {
            console.log(error);
            return reject(error);
        }

        let accountAssets = fullAccounts[0][1].assets;

        let response;
        try {
            response = await lookup_asset_symbols(Apis, accountAssets);
        } catch (error) {
            console.log(error);
            return reject(error);
        }

        return resolve(response);
    });
}

/**
 * Retrieve the object contents
 * @param {String} node 
 * @param {String} objectID 
 * @returns 
 */
async function fetchObject(node, objectID) {
    return new Promise(async (resolve, reject) => {

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        let object;
        try {
            object = await Apis.instance().db_api().exec("get_objects", [[objectID]])
        } catch (error) {
            console.log(error);
            return reject();
        }

        return resolve(object);
    });
}

/**
 * Retrieve the object contents
 * @param {String} node 
 * @param {Object} asset
 * @returns 
 */
 async function fetchDynamicData(node, asset) {
    return new Promise(async (resolve, reject) => {

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        const issuerID = asset.issuer;
        let issuerObject;
        try {
            issuerObject = await Apis.instance().db_api().exec("get_objects", [[issuerID]])
        } catch (error) {
            console.log(error);
        }

        const dynamicDataID = asset ? asset.dynamic_asset_data_id : null;
        let dynamicData;
        try {
            dynamicData = await Apis.instance().db_api().exec("get_objects", [[dynamicDataID]]);
        } catch (error) {
            console.log(error);
        }

        return resolve({
            issuer: issuerObject && issuerObject.length ? issuerObject[0].name : '???',
            quantity: dynamicData && dynamicData.length ? dynamicData[0].current_supply : '???'
        });
    });
}

/**
 * Fetch the user's NFT balances from the blockchain
 * @param {String} node 
 * @param {String} accountID 
 */
 async function fetchUserBalances(node, accountID) {
    return new Promise(async (resolve, reject) => {

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log({error, loc: "Apis"});
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        let balanceResult;
        try {
            balanceResult = await Apis.instance().db_api().exec("get_account_balances", [accountID, []]);
        } catch (error) {
            console.log({error, loc: "balanceResult"});
            return reject();
        }

        let balanceDetails;
        try {
            balanceDetails = await lookup_asset_symbols(Apis, balanceResult.map(asset => asset.asset_id), true);
        } catch (error) {
            console.log({error, loc: "lookup_asset_symbols"});
            return reject();
        }

        let mappedAssets = balanceResult.map((balance) => {
            let symbolData = balanceDetails.find(symbol => symbol.id === balance.asset_id);
            if (symbolData) {
                const amount = parseInt(balance.amount)
                let preciseAmount = amount > 0
                                        ? parseInt(amount / Math.pow(10, symbolData.precision))
                                        : 0
                return {
                    ...balance, ...symbolData, preciseAmount, splitSymbol: symbolData.symbol.split('.')[0]
                }
            }
        });
        
        return resolve(mappedAssets);
    });
}

/**
 * Fetch the orderbook for an NFT
 * @param {String} node 
 * @param {String} base 
 * @param {String} quote 
 * @param {Integer} limit 
 * @returns 
 */
async function fetchOrderBook(node, base, quote, limit) {
    return new Promise(async (resolve, reject) => {
        
        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            let changeURL = appStore.getState().changeURL;
            changeURL();
            return reject();
        }

        let orderBook;
        try {
            orderBook = await Apis.instance().db_api().exec("get_order_book", [[base, quote, limit]])
        } catch (error) {
            console.log(error);
            return reject();
        }

        return resolve(orderBook);
    });
}


export {
    testNodes,
    fetchUserBalances,
    fetchIssuedAssets,
    fetchAssets,
    fetchObject,
    fetchDynamicData,
    fetchOrderBook,
    accountSearch
};