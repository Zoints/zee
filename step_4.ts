import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    Token,
    TOKEN_PROGRAM_ID,
    u64
} from '@solana/spl-token';
import { Keypair, Transaction } from '@solana/web3.js';
import { SUPPLY } from './config';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT STEP 4`);
console.log(`==========================`);
(async () => {
    const helper = await CreateHelper();
    await helper.verifyBlockchain();

    const { mint, authority } = await helper.getMintKeys();

    const token = new Token(
        helper.connection,
        mint.publicKey,
        TOKEN_PROGRAM_ID,
        new Keypair()
    );
    const mintAccount = await token.getMintInfo();

    if (!mintAccount.supply.eq(new u64(SUPPLY))) {
        throw new Error(
            `the token's supply (${mintAccount.supply.toString()}) isn't ${SUPPLY}`
        );
    }

    const tx = new Transaction().add(
        Token.createSetAuthorityInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            null,
            'MintTokens',
            authority.publicKey,
            []
        )
    );

    console.log(`Removing Mint Authority`);
    await helper.signAndVerify(tx);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
