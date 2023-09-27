import {createWalletClient, custom, encodeFunctionData} from "viem";
import {baseGoerli} from "viem/chains";
import {Fragment, useEffect, useState} from "react";
import {CyberAccount, CyberBundler} from "@cyberlab/cyber-account";
import Loading from "./Loading";

function CyberAccountInfo() {

    const [loading, setLoading] = useState(false)
    const [cyberAccount, setCyberAccount] = useState(false)

    const loadPost = async () => {
        try {
            const walletClient = createWalletClient({
                chain: baseGoerli,
                transport: custom(window.ethereum),
            });

            const accounts = await walletClient.requestAddresses();
            const ownerAddress = accounts[0];
            const sign = async (message) => {
                return await walletClient.signMessage({
                    account: ownerAddress,
                    message: {raw: message},
                });
            };
            const cyberBundler = new CyberBundler({
                rpcUrl: "https://api.stg.cyberconnect.dev/cyberaccount/bundler/v1/rpc",
                appId: '381afac6-09d7-425f-b4dc-9538538224e4',
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

            })
            // // After fetching data stored it in posts state.
            setCyberAccount(cyberAccount);
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        loadPost()
    }, []);

    async function handleClick() {
        try {
            setLoading(true)
            const encoded = encodeFunctionData({
                abi: [    {
                    "inputs": [
                        {
                            "components": [
                                {
                                    "internalType": "string",
                                    "name": "typeReward",
                                    "type": "string"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                }
                            ],
                            "internalType": "struct MoonFitAccivitiesWithoutApprove.Reward",
                            "name": "rewards",
                            "type": "tuple"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timeSpin",
                            "type": "uint256"
                        }
                    ],
                    "name": "spinLuckyWheel",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },],
                functionName: "spinLuckyWheel",
                args: [
                    ["MoonBoxSlot", 1],
                    1695284290,
                ],
            });
            console.log(encoded)
            const transactionData = {
                to: "0xAB65A6f6d5b290741E444CFd745687D4727Dc3b4",
                value: BigInt(0),
                data: '0x26498234000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000650bfc4200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000b4d6f6f6e426f78536c6f74000000000000000000000000000000000000000000',
            }
            const tx = await cyberAccount.sendTransaction(transactionData)
            console.log(tx)
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Fragment>
            <button disabled={loading} onClick={handleClick} style={{display: 'flex', alignItems: 'center'}}>
                {loading && <Loading />} My CyberAccount {cyberAccount.address}
            </button>
            <button onClick={loadPost}>Retry</button>
        </Fragment>

    );
}

export default function MyApp() {
    return (
        <div>
            <h1>Welcome to CyberAccount</h1>
            <CyberAccountInfo/>
        </div>
    );
}
