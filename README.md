# Bitshares NFT issuance tool
An NFT issuance tool for the Bitshares production & testnet blockchains.

This tool integrates with the [latest BEET wallet](https://github.com/bitshares/beet/pull/181).

Perform the following steps:
* manually remove 'beet-js' from the package.json file
* run `yarn install`
* reintroduce the 'beet-js' dependency to the package.json file
* manually copy the [beet-js repo contents](https://github.com/bitshares/beet-js/pull/44) to the /node_modules/ folder
* run `yarn run dev`
