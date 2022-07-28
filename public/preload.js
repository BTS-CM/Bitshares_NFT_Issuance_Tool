// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");
const Socket = require('simple-websocket');
const config = require("../src/config/config.json");

// Note: Changes to this file will require a build before electron:start works

/**
 * Test a wss url for successful connection.
 * @param {String} url
 * @returns {Object}
 */
async function _testConnection(url) {
    return new Promise(async (resolve, reject) => {
        let before = new Date();
        let beforeTS = before.getTime();
        let connected;

        let socket = new Socket(url);
        socket.on('connect', () => {
        connected = true;
        socket.destroy();
        });

        socket.on('error', (error) => {
        socket.destroy();
        });

        socket.on('close', () => {
        if (connected) {
            let now = new Date();
            let nowTS = now.getTime();
            return resolve({ url: url, lag: nowTS - beforeTS });
        } else {
            return resolve(null);
        }
        });
    });
}

/**
 * Test the wss nodes, return latencies and fastest url.
 * @returns {Promise}
 */
async function _testNodes(target) {
    return new Promise(async (resolve, reject) => {
        let urls = config[target].nodeList.map(node => node.url);

        return Promise.all(urls.map(url => _testConnection(url)))
        .then((validNodes) => {
        let filteredNodes = validNodes.filter(x => x);
        if (filteredNodes.length) {
            let sortedNodes = filteredNodes.sort((a, b) => a.lag - b.lag);
            console.log(`Fastest node: ${sortedNodes[0].url}`);

            let now = new Date();
            return resolve({
                node: sortedNodes[0].url,
                latencies: sortedNodes,
                timestamp: now.getTime()
            });
        } else {
            console.error("No valid BTS WSS connections established; Please check your internet connection.")
            return reject();
        }
        })
        .catch(error => {
        console.log(error);
        })
    });
}

async function _galleryLink(target) {
    ipcRenderer.send('openGallery', target);
}

async function _beetLink(target) {
    ipcRenderer.send('beetDownload', target);
}

async function _IPFSLink(target) {
    ipcRenderer.send('ipfs', target);
}

/*
 * Testing node latencies for requested blockchain
 */
ipcRenderer.on('fetchNodes', async (event, arg) => {
  console.log(`ipcRenderer fetchNodes ${arg}`);

  let nodes = await _testNodes(arg);

  event.sender.send(`node_response`, nodes ?? []);
});

contextBridge.exposeInMainWorld(
    "electron",
    {
        testConnections: async (target) => {
            return _testNodes(target);
        },
        openGallery: async (target) => {
            return _galleryLink(target);
        },
        beetDownload: async (target) => {
            return _beetLink(target);
        },
        ipfs: async (target) => {
            return _IPFSLink(target);
        }
    }
);