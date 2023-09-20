require('dotenv').config()
const {CyberAccount, CyberBundler, CyberPaymaster} = require("@cyberlab/cyber-account");
const {privateKeyToAccount} = require("viem/accounts")
const {createWalletClient, http, parseUnits} = require("viem")
const {baseGoerli} = require("viem/chains")
const moment = require('moment')

const jwt = require('jsonwebtoken');

const appId = process.env.APP_ID

const providerRPC = {
    name: 'Base Goerli',
    rpc: 'https://goerli.base.org',
    chainId: 84531,
    tokenName: 'ETH',
}

/**
 * Decrypt JWE Web Token
 *
 * @returns {Promise<object>}
 * @param sender
 */
const getToken = async (sender) => {

    // This is the Private Key kept on the server.  This was
    // the key created along with the Public Key after login.
    // The public key was sent to the App and the Private Key
    // stays on the server.
    // I'm hard-coding the key here just for convenience but
    // normally it would be held in a database to
    // refer during the API call.

    const privateKey = process.env.PRIVATE_KEY_AUTH;

    try {
        const iat = moment()
        const exp = iat.clone().add(24, 'hours')
        const input = {
            // issuer name
            "iss": "MF",
            // issue at, timestamp in second
            "iat": iat.toDate().getTime(),
            // expire at, timestamp in second
            "exp": exp.toDate().getTime(),
            // app id from CyberConnect dev center
            "aid": appId,
            // CyberAccount address
            sender,
        }
        return jwt.sign(input, privateKey);

    } catch (err) {
        throw new Error(err.message);
    }

}


const privateKey = process.env.PRIVATE_WALLET_TETS
const ownerAddress = process.env.OWNER_ADDRESS

const main = async () => {

    const cyberBundler = new CyberBundler({
        rpcUrl: "https://api.stg.cyberconnect.dev/cyberaccount/bundler/v1/rpc",
        appId,
    });

    const account = privateKeyToAccount(privateKey)


    // console.log("ownerAddress", account);

    const walletClient = createWalletClient({
        account: ownerAddress,
        chain: baseGoerli,
        transport: http(providerRPC.rpc)
    })
    //
    // console.log('walletClient', walletClient)

    const sign = async (message) => {
        return await walletClient.signMessage({
            account,
            message: {raw: message},
        });
    };

    console.log('sign', sign);

// Optional: Paymaster

    const cyberPaymaster = new CyberPaymaster({
        rpcUrl: "https://api.stg.cyberconnect.dev/cyberaccount/paymaster/v1/rpc",
        appId,
        generateJwt: (cyberAccountAddress) => getToken(cyberAccountAddress),
    });


    const cyberAccount = new CyberAccount({
        chain: {
            id: 84531,
            testnet: true,
        },
        owner: {
            address: ownerAddress,
            signMessage: sign,

        },
        bundler: cyberBundler,
        paymaster: cyberPaymaster,

    });
    console.log("thaovt", cyberAccount);
    const cyberAccountAddress = cyberAccount.address

    const transactionData = {
        to: cyberAccountAddress,
        value: parseUnits("0.0001", 18),
        data: "0x",
    }
    const callData = await cyberAccount.getCallData(transactionData);
    console.log(callData)
    const signature = await sign(callData)

    const userOperation = {
        "sender": cyberAccountAddress,
        "nonce": "0x2a",
        "initCode": await cyberAccount.getAccountInitCode(),
        callData,
        callGasLimit: "500000",
        verificationGasLimit: "200000",
        preVerificationGas: "50000",
        maxFeePerGas: "1000000000",
        maxPriorityFeePerGas: "100000000",
        paymasterAndData: "0x",

        "signature": signature,
    }
    console.log(userOperation)
    cyberAccount.paymaster.jwt = await cyberAccount.paymaster.generateJwt()
    console.log(cyberAccount.paymaster.jwt)
    console.log("thaovt", cyberAccount);


    // const estGas = await cyberBundler.estimateUserOperationGas(userOperation, ownerAddress, providerRPC.chainId)
    // const b = await cyberBundler.sendUserOperation(userOperation, ownerAddress, providerRPC.chainId)
    const c = await cyberAccount.sendTransaction(transactionData, {disablePaymaster: false});

    console.log(c)

}


setImmediate(async () => {
    await main()
    process.exit()
})