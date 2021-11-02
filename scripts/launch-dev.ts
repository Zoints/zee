import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import { Instruction } from '@zoints/staking';
import { TreasuryInstruction } from '@zoints/treasury';

const connection = new Connection('http://localhost:8899', 'confirmed');
const funder = new Keypair();

const mint = new Keypair();
const mintAuthority = new Keypair();
const staking = new PublicKey('FBxGvPGn5248SUX6kV13MntjuGw3M5ka55kYPxg1Uju9');
const treasury = new PublicKey('9uYgeEQP3RDZg9TX5iaeoM9y4XZu22wa4jRpjCctDJbk');

(async () => {
    let sig = await connection.requestAirdrop(
        funder.publicKey,
        LAMPORTS_PER_SOL * 5
    );
    await connection.confirmTransaction(sig);

    const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
        connection
    );

    console.log(`Funder: ${Buffer.from(funder.secretKey).toString('hex')}`);
    console.log(`Mint: ${mint.publicKey.toBase58()}`);
    console.log(`Staking Program Id: ${staking.toBase58()}`);
    console.log(`Treasury Program Id: ${treasury.toBase58()}`);

    const tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: funder.publicKey,
            newAccountPubkey: mint.publicKey,
            lamports: balanceNeeded,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID
        }),
        Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            0,
            mintAuthority.publicKey,
            null
        ),
        await Instruction.Initialize(
            staking,
            funder.publicKey,
            mint.publicKey,
            new Date(),
            60
        ),
        await TreasuryInstruction.Initialize(
            treasury,
            funder.publicKey,
            mint.publicKey
        )
    );
    console.log('Sending transaction...');
    console.log(
        await sendAndConfirmTransaction(connection, tx, [funder, mint])
    );
})().then(() => process.exit(0));
