import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";

/**
 * broadcast the create asset operation
 * @param {String} wsURL
 * @param {String} mode
 * @param {Object} operationJSON 
 */
 async function generateObject(mode, operationJSON) {
    return new Promise(async (resolve, reject) => {
        let tr = new TransactionBuilder();

        console.log({
            operationJSON,
            mode
        })

        try {
            tr.add_type_operation(
                mode === "create" ? "asset_create" : "asset_update",
                operationJSON
            );
        } catch (error) {
            console.error(error);
            return reject();
        }

        try {
            await tr.update_head_block();
        } catch (error) {
            console.error(error);
            return reject();
        }

        try {
            await tr.set_expire_seconds(1024);
        } catch (error) {
            console.log(error);
            return reject();
        }

        try {
            await tr.set_required_fees();
        } catch (error) {
            console.error(error);
            return reject();
        }

        return resolve(tr.toObject());
    });
}

/**
 * broadcast the create asset operation
 * @param {Object} connection
 * @param {String} wsURL
 * @param {String} mode
 * @param {Object} operationJSON 
 */
async function broadcastOperation(connection, wsURL, mode, operationJSON) {
    return new Promise(async (resolve, reject) => {
        let TXBuilder;
        try {
            TXBuilder = connection.inject(TransactionBuilder, {sign: true, broadcast: true});
        } catch (error) {
            console.log(error);
            return reject();
        }

        try {
        await Apis.instance(
            wsURL,
            true,
            10000,
            {enableCrypto: false, enableOrders: true},
            (error) => console.log(error),
        ).init_promise;
        } catch (error) {
            console.log(`api instance: ${error}`);
            changeURL();
            return reject();
        }

        let tr = new TXBuilder();

        try {
            tr.add_type_operation(
                mode === "create" ? "asset_create" : "asset_update",
                operationJSON
            );
        } catch (error) {
            console.error(error);
            return reject();
        }

        try {
            await tr.update_head_block();
        } catch (error) {
            console.error(error);
            return reject();
        }

        try {
            await tr.set_expire_seconds(1024);
        } catch (error) {
            console.log(error);
            return reject();
        }

        try {
            await tr.set_required_fees();
        } catch (error) {
            console.error(error);
            return reject();
        }

        try {
            tr.add_signer("inject_wif");
        } catch (error) {
            console.error(error);
            return reject();
        }

        let result;
        try {
            result = await tr.broadcast();
        } catch (error) {
            console.error(error);
            return reject();
        }

        return resolve(result);
    });
}

export {
    generateObject,
    broadcastOperation
}
  