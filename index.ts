import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CreateHelper } from './helper';

(async () => {
    const helper = await CreateHelper();

    const funder = await helper.getFunderPublicKey();
    const balance = await helper.connection.getBalance(funder);
    console.log(
        `Funder: ${funder.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`
    );

    const { mint, authority } = await helper.getMintKeys();
    console.log(`Mint: ${mint.publicKey.toBase58()}`);
    console.log(`Mint Authority: ${authority.publicKey.toBase58()}`);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
