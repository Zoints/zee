import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT STEP 1`);
console.log(`==========================`);
(async () => {
    const helper = await CreateHelper();

    const funder = await helper.getFunderPublicKey();
    const { mint, authority } = await helper.getMintKeys();

    console.log(`Create transaction to:`);
    console.log(` 1. Create ZEE Mint at Address ${mint.publicKey.toBase58()}`);

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

    await helper.signAndVerify(tx);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
