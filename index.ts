// add vault later
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import assert from 'assert';

const connection = new Connection('http://localhost:8899');

const SUPPLY = 10_000_000_000_000;

const distribute = [
    {
        name: 'Team',
        amount: 1_600_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'Early Adopters',
        amount: 700_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsDevOps',
        amount: 2_000_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsBizDev',
        amount: 1_400_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'Staking',
        amount: 3_600_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsMarketing',
        amount: 200_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsSupport',
        amount: 400_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'ZAI Reward Fund',
        amount: 100_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    }
];

const funder = new Keypair();
const mint = new Keypair();
const mintAuthority = new Keypair();

let total = 0;
for (let item of distribute) {
    total += item.amount;
}

assert(total === SUPPLY);

(async () => {
    const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
        connection
    );
    const transaction = new Transaction()
        .add(
            SystemProgram.createAccount({
                fromPubkey: funder.publicKey,
                newAccountPubkey: mint.publicKey,
                lamports: balanceNeeded,
                space: MintLayout.span,
                programId: TOKEN_PROGRAM_ID
            })
        )
        .add(
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                mintAuthority.publicKey,
                null
            )
        );

    const sig = await sendAndConfirmTransaction(connection, transaction, [
        funder,
        mint
    ]);
    console.log(`Mint initialized: ${sig}`);
})();
