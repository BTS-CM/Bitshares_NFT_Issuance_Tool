// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");
const Socket = require('simple-websocket');

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

async function _openURL(target) {
    ipcRenderer.send('openURL', target);
}

/*
 * Testing node latencies for requested blockchain
 */
ipcRenderer.on('fetchNodes', async (event, arg) => {
  console.log(`ipcRenderer fetchNodes ${arg}`);

  let nodes = await _testNodes(arg);

  event.sender.send(`node_response`, nodes ?? []);
});

window.electron = {
    testConnection: async (url) => {
        return _testConnection(url);
    },
    openURL: async (target) => {
        return _openURL(target);
    }
}

/*
contextBridge.exposeInMainWorld(
    "electron",
    {
        testConnections: async (target) => {
            return _testNodes(target);
        },
        openURL: async (target) => {
            return _openURL(target);
        }
    }
);
*/