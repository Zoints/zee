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
import { getConfig } from './config';

const SUPPLY = 10_000_000_000_000;

let connection: Connection;

(async () => {
    const config = getConfig();

    connection = new Connection(config.solana.url, config.solana.commitment);

    // Step 1: Verify Config Parameters
    let sum = config.staking.rewardPool;
    for (const recipient of config.payout) {
        sum += recipient.direct + recipient.vested;
    }

    if (sum != SUPPLY) {
        throw new Error(
            `Configuration sum added up to: ${sum}, expected ${SUPPLY}`
        );
    }

    await verifyProgramId('Staking', config.staking.programId);
    await verifyProgramId('Treasury', config.treasury.programId);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));

async function verifyProgramId(name: string, programId: PublicKey) {
    const account = await connection.getAccountInfo(programId);
    if (account === null) {
        throw new Error(`Unable to find the ${name} program on the blockchain`);
    }

    if (!account.executable) {
        throw new Error(
            `The ${name} account was found but is not an executable program`
        );
    }
}
