require('http-inspector/inject')
require('dotenv').config()
const {CyberAccount, CyberBundler, CyberPaymaster} = require("@cyberlab/cyber-account")
const {privateKeyToAccount} = require("viem/accounts")
const {createWalletClient, http, parseUnits, encodeFunctionData, parseEther, createPublicClient} = require("viem")
const {baseGoerli} = require("viem/chains")

const jwt = require('jsonwebtoken')
const fs = require("fs")
const path = require("path")
const {moonfitActivitiesContractAddress, ONCHAIN_ACTIVITY} = require("./constants/onchain-activity")
const MoonFitActivities = require('./abis/MoonFitActivities.json')
const {getDataTx} = require("./services/onChainActivity")
const {TokenReceiverAbi} = require("./abis/TokenReceiverAbi");

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

    try {
        // const iat = moment().utc()
        // const exp = iat.clone().add(24, 'hours')
        const input = {
            // issuer name
            "iss": "MF",
            // issue at, timestamp in second
            "iat": 1695712877,
            // expire at, timestamp in second
            "exp": 1696058456,
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
    console.log(account)

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
            id: providerRPC.chainId,
            testnet: true,
        },
        owner: {
            address: ownerAddress,
            signMessage: sign,

        },
        bundler: cyberBundler,
        paymaster: cyberPaymaster

    })
    console.log(cyberAccount)


    const encoded = encodeFunctionData({
        abi: MoonFitActivities,
        functionName: "spinLuckyWheel",
        args: [
            ["MoonBoxSlot", 1],
            1695284290,
        ],
    });
    console.log(encoded)
    const transactionData = {
        to: moonfitActivitiesContractAddress,
        value: BigInt(0),
        data: encoded,
    }
    // const transactionData = {
    //     to: '0xA80E67aC0D0A0D21fdF0503a52A223A96Eef5455',
    //     value: parseUnits("0.0001", 18),
    //     data: '0x',
    // }
    // const {balance} = await cyberAccount.paymaster.getUserCredit(cyberAccount.address, providerRPC.chainId)
    //
    // console.log(parseEther(balance))
    //
    // console.log(transactionData)
    // const userOperationHash = await cyberAccount.sendTransaction(transactionData, {disablePaymaster: true})
    //
    // console.log("userOperationHash", userOperationHash)

    const txHash = await cyberAccount.bundler.getUserOperationReceipt('0x72a61a69f9dc6193a271dc5605b368cd3a78029da4eeb3204b9dd9311db96ea5', providerRPC.chainId)
    console.log("txHash", txHash)

    // const {request} = await cyberAccount.publicClient.simulateContract({
    //     account,
    //     address: moonfitActivitiesContractAddress,
    //     abi: MoonFitActivities,
    //     functionName: "spinLuckyWheel",
    //     args: [
    //         ["MoonBoxSlot", 1],
    //         1695284290,
    //     ],
    //     value: parseUnits("0", 18),
    // })
    // console.log("thaocvt", request)
    // const tx2 = await walletClient.writeContract(request);
    // console.log(tx2)


    //Top-up transaction
    // console.log(cyberAccount)
    // console.log(cyberAccount.publicClient)
    // const abi = {
    //     "inputs": [
    //         {
    //             "internalType": "address",
    //             "name": "to",
    //             "type": "address"
    //         }
    //     ],
    //     "name": "depositTo",
    //     "outputs": [],
    //     "stateMutability": "payable",
    //     "type": "function"
    // }
    // console.log("22222")
    // const {request} = await cyberAccount.publicClient.simulateContract({
    //     account,
    //     address: '0x52b90f8e69ac72fe0f46726eadda13835cbb01fa',
    //     abi: [abi],
    //     functionName: "depositTo",
    //     args: [cyberAccount?.address],
    //     value: parseUnits("0.01", 18),
    // })
    // console.log("thaocvt", request)
    // const tx = await walletClient.writeContract(request);
    // console.log(tx)


    // call contract setApprovedOperator
    // const client = createPublicClient({
    //     chain: baseGoerli,
    //     transport: http(providerRPC.rpc)
    // })
    //
    // const {request} = await client.simulateContract({
    //     address: '0xE9845334e513Fdb76D45aEa129279597d6E6A8Ff',
    //     abi: MoonFitActivities,
    //     functionName: "setApprovedOperator",
    //     args: ['0x70b7B15188bb77aAaB4E966FbeAc0A0932E11bcE', true],
    //     value: BigInt(0),
    //     account,
    // })
    // console.log("thaocvt", request)
    //
    // const _tx = await walletClient.writeContract(request);
    // console.log("thaocvt", _tx)
}


setImmediate(async () => {

    await main()
    process.exit()
})