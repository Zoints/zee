// add vault later
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    Token,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import assert from 'assert';
import NodeVault from 'node-vault';
import { getConfig } from './config';

const config = getConfig();

const connection = new Connection(config.solana.url, config.solana.commitment);

const SUPPLY = 10_000_000_000_000;

(async () => {
    console.log(config);

    // verify config values
    let sum = config.staking.rewardPool;
    for (const recipient of config.payout) {
        sum += recipient.direct + recipient.vested;
    }

    if (sum != SUPPLY) {
        throw new Error(
            `Configuration sum added up to: ${sum}, expected ${SUPPLY}`
        );
    }
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
