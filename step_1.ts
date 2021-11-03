import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    Connection,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT STEP 1`);
console.log(`==========================`);

(async () => {
    const helper = await CreateHelper();

    const funder = await helper.getFunderPublicKey();
    const { mint, authority } = await helper.getMintKeys();

    const balanceNeeded =
        await helper.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
        );
    let tx = new Transaction();
    tx.add(
        SystemProgram.createAccount({
            fromPubkey: funder,
            newAccountPubkey: mint.publicKey,
            lamports: balanceNeeded,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID
        }),
        Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            0,
            authority.publicKey,
            null
        )
    );

    tx.feePayer = funder;
    tx.recentBlockhash = (
        await helper.connection.getRecentBlockhash()
    ).blockhash;

    tx = await helper.signWithFunder(tx);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
