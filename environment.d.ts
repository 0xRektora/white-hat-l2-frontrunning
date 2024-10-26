declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            PROVIDER: string;
            SEQUENCER: string;
            VICTIM_WALLET_PK: string;
            GAS_WALLET_PK: string;
            TARGET_CONTRACT: string;
            ETHER_AMOUNT: string;
        }
    }
}

export {}