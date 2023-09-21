require('dotenv').config()
const {CyberAccount, CyberBundler, CyberPaymaster} = require("@cyberlab/cyber-account")
const {privateKeyToAccount} = require("viem/accounts")
const {createWalletClient, http, parseUnits} = require("viem")
const {baseGoerli} = require("viem/chains")
// const moment = require('moment')

const jwt = require('jsonwebtoken')
const fs = require("fs")
const path = require("path")
const {moonfitActivitiesContractAddress, ONCHAIN_ACTIVITY} = require("./constants/onchain-activity")
const {getDataTx} = require("./services/onChainActivity")

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
    const assetPath = path.join(__dirname, '../key/privateKey.pem')
    const privateKeyAuth = fs.readFileSync(assetPath, 'utf8')
    console.log(privateKeyAuth)

    try {
        // const iat = moment().utc()
        // const exp = iat.clone().add(24, 'hours')
        const input = {
            // issuer name
            "iss": "MF",
            // issue at, timestamp in second
            "iat": 1695280670,
            // expire at, timestamp in second
            "exp": 1695355123,
            // app id from CyberConnect dev center
            "aid": appId,
            // CyberAccount address
            sender,
        }
        const signOptions = {
            algorithm: "RS256"
        }
        return jwt.sign(input, privateKeyAuth, signOptions)

    } catch (err) {
        console.log(err)
        throw new Error(err.message)
    }

}


const privateKey = process.env.PRIVATE_WALLET_TETS
const ownerAddress = process.env.OWNER_ADDRESS

const main = async () => {

    const cyberBundler = new CyberBundler({
        rpcUrl: "https://api.stg.cyberconnect.dev/cyberaccount/bundler/v1/rpc",
        appId,
    })

    const account = privateKeyToAccount(privateKey)

    const walletClient = createWalletClient({
        account: ownerAddress,
        chain: baseGoerli,
        transport: http(providerRPC.rpc)
    })
    const sign = async (message) => {
        return await walletClient.signMessage({
            account,
            message: {raw: message},
        })
    }
    const cyberPaymaster = new CyberPaymaster({
        rpcUrl: "https://api.stg.cyberconnect.dev/cyberaccount/paymaster/v1/rpc",
        appId,
        generateJwt: (cyberAccountAddress) => getToken(cyberAccountAddress),
    })
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

    })

    const cyberAccountAddress = cyberAccount.address

    const dataTx = await getDataTx({
        type: ONCHAIN_ACTIVITY.TYPE.LUCKY_WHEEL,
        reward: {"typeReward": "MoonBoxSlot", "value": 1},
        timeSpin: 1695284290
    })
    const transactionData = {
        from: cyberAccountAddress,
        to: moonfitActivitiesContractAddress,
        value: 0,
        data: dataTx.encodeABI(),
    }

    const tx = await cyberAccount.sendTransaction(transactionData, {disablePaymaster: true});
    console.log(tx)

}


setImmediate(async () => {
    await main()
    process.exit()
})