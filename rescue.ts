import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

// Do not change
const TARGET_CONTRACT = process.env.TARGET_CONTRACT;

// Change this to your convenience.
// It's a fallback in case the provider can't estimate the gas.
const DEFAULT_GAS_LIMIT = 1_000_000n;

// This is the buffer we add to the gas limit to make sure the transaction goes through.
const DEFAULT_GAS_LIMIT_BUFFER = 200_000n;

/**
 * You can update this part of the code to include the functions you want to call
 * from the victim contract. You can also add more functions to the array.
 */
function buildCalldata() {
    const iface = new ethers.Interface(['function setNumber(uint256 a)']);

    const newNumber = 42;
    const setNumberCall = iface.encodeFunctionData('setNumber', [newNumber]);
    return [setNumberCall];
}

async function rescue() {
    checkEnv();

    /**
     * Load providers + signers
     */
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
    const sequencer = new ethers.JsonRpcProvider(process.env.SEQUENCER);

    const signer = new ethers.BaseWallet(new ethers.SigningKey(process.env.VICTIM_WALLET_PK), provider);
    const compromisedOwner = signer.address;
    const gasSigner = new ethers.BaseWallet(new ethers.SigningKey(process.env.GAS_WALLET_PK), provider);

    /**
     * Build and sign eth transactions.
     */
    const calls: ethers.JsonRpcPayload[] = []; // Calls to send to the sequencer/rpc provider

    // Build and sign the gas transaction
    const fee = await provider.getFeeData();
    const gasEstimate = await getGasEstimate(signer, '', ethers.ZeroAddress);

    const gasUnsignedTx = {
        to: compromisedOwner,
        value: ethers.parseUnits(process.env.ETHER_AMOUNT, 'ether'),
        gasLimit: gasEstimate,
        gasPrice: fee.gasPrice,
        chainId: process.env.CHAIN_ID,
        nonce: await gasSigner.getNonce(),
    };
    calls.push({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [await gasSigner.signTransaction(gasUnsignedTx)],
    });

    // Build and sign the rescue transactions
    const calldata = buildCalldata();
    for (let i = 0; i < calldata.length; i++) {
        const tx = await createNewTransaction(signer, provider, calldata[i], TARGET_CONTRACT, i);
        calls.push(await buildAndSignRpcCall(signer, i + 2, tx)); // We start at 2 because the gas transaction is at 1
    }

    // Send the transactions
    const res = await sequencer._send(calls);
    console.log(res);
}

async function createNewTransaction(
    signer: ethers.BaseWallet,
    provider: ethers.JsonRpcProvider,
    calldata: string,
    targetContract: string,
    txPosition: number
) {
    const gasEstimate = await getGasEstimate(signer, calldata, targetContract, true);
    console.log(`Gas estimate for tx ${txPosition}: ${gasEstimate}`);

    const fee = await provider.getFeeData();
    const unsignedTx = {
        data: calldata,
        to: targetContract,
        gasLimit: gasEstimate,
        gasPrice: fee.gasPrice,
        chainId: process.env.CHAIN_ID,
        nonce: (await signer.getNonce()) + txPosition,
    };
    return unsignedTx;
}

async function buildAndSignRpcCall(
    signer: ethers.BaseWallet,
    id: number,
    tx: ethers.TransactionRequest
): Promise<ethers.JsonRpcPayload> {
    return {
        id: id,
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [await signer.signTransaction(tx)],
    };
}

async function getGasEstimate(signer: ethers.BaseWallet, calldata: string, targetContract: string, addBuffer = false) {
    let gasEstimate;
    try {
        gasEstimate = await signer.estimateGas({
            data: calldata,
            to: targetContract,
        });
    } catch (e) {
        gasEstimate = DEFAULT_GAS_LIMIT;
    }
    if (addBuffer) {
        gasEstimate += DEFAULT_GAS_LIMIT_BUFFER;
    }
    return gasEstimate;
}

function checkEnv() {
    if (
        !process.env.PROVIDER ||
        !process.env.SEQUENCER ||
        !process.env.VICTIM_WALLET_PK ||
        !process.env.GAS_WALLET_PK ||
        !process.env.ETHER_AMOUNT ||
        !process.env.CHAIN_ID
    ) {
        console.error(
            'Please make sure to set the PROVIDER, SEQUENCER, VICTIM_WALLET_PK, GAS_WALLET_PK, ETHER_AMOUNT and CHAIN_ID environment variables.'
        );
        process.exit(1);
    }
}

rescue();
