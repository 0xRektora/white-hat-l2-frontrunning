![white-hat-l2-frontrunning](./assets/logo.svg "White hat L2 frontrunning")

# white-hat-l2-frontrunning

A simple and easy EthersJS tool to send a bundle of transactions on L2s and fast paced EVM chains.

This tool was made to run on Arbitrum, but can work on other fast producing block chains. Because of the speed and the ability of posting transaction privately through the Arbitrum sequencer, one can send a bundle transaction to rescue a compromised wallet.

It is worth noting that on Arbitrum, JsonBatchRPC will post the transactions on adjacent blocks (N, N+1), whereas on other chains (Fantom for example), it'll put the transactions on the same block ([Ref](https://hackmd.io/@oS7_rZFHQnCFw_lsRei3nw/BJDT0IVZp#Batch-mode).).



## Installation

If you wish to run the tool locally, you can install the dependencies with `yarn` and run it with `ts-node`

```bash
  yarn
```

A `Dockerfile` is also available to use the script inside of a docker container.
    
## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file. Template can be found in `.env.example`
If using something else than Arbitrum, 
```
PROVIDER=https://arb1.arbitrum.io/rpc # Your provider URL
SEQUENCER=https://arb1-sequencer.arbitrum.io/rpc # Sequenecer URL if applicable. If not, use the same value as PROVIDER
VICTIM_WALLET_PK= # The compromised wallet private key
GAS_WALLET_PK= # The gas wallet private key
TARGET_CONTRACT=0x6e946816112526aA49b2F3F893677aac3328C7D7 # The target contract address

# The amount of ether to send from the gas wallet to the victim wallet
# In ether, e.g. 0.0001
ETHER_AMOUNT=0.0001
```
## Setup

The default code `TARGET_CONTRACT` of the script is an Arbitrum Counter contract. Without any changes to the script, running it will send gas from the `GAS_WALLET_PK` to the `VICTIM_WALLET_PK` as a first Tx, followed by a call to the `increment()` function of the contract. This can be used for testing and to showcase how the script behave and the chain reacts.

To customize the calldata, one can update the following function
```typescript
// ./rescue.ts

function buildCalldata() {
    const iface = new ethers.Interface(['function setNumber(uint256 a)']);

    const newNumber = 42;
    const setNumberCall = iface.encodeFunctionData('setNumber', [newNumber]);
    return [setNumberCall];
}
```
## Run Locally

To run the code locally
```bash
npx ts-node -T rescue.ts
```

To run the code using Docker
```bash
docker build --tag 'l2-frontrunning' . && docker run --rm 'l2-frontrunning'
```
## Authors

- [@0xRektora](https://www.github.com/0xRektora)

## License

[MIT](https://choosealicense.com/licenses/mit/)