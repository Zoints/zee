import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Staking } from '@zoints/staking';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT INFORMATION`);
console.log(`==========================`);

(async () => {
    const helper = await CreateHelper();

    let connected = false;
    try {
        await helper.connection.getGenesisHash();
        connected = true;
    } catch (e) {}
    console.log(`Endpoints`);
    console.log(
        `   Solana: ${helper.config.solana.url} (${
            connected ? 'running' : 'not reachable'
        })`
    );
    console.log(`    Vault: ${helper.config.vault.url}`);
    console.log();

    console.log(`Staking`);
    let loaded = false;
    let initialized = false;
    try {
        if (connected) {
            await helper.verifyProgramId('', helper.config.staking.programId);
            loaded = true;

            const settings = await Staking.settingsId(
                helper.config.staking.programId
            );
            const settingsacc = await helper.connection.getAccountInfo(
                settings
            );
            if (settingsacc !== null) {
                initialized = true;
            }
        }
    } catch (e) {}
    console.log(
        `   Program ID: ${helper.config.staking.programId} (${
            loaded
                ? 'program loaded' + (initialized ? ' & initialized' : '')
                : 'program not found'
        })`
    );
    console.log();

    loaded = false;
    try {
        if (connected) {
            await helper.verifyProgramId('', helper.config.treasury.programId);
            loaded = true;
        }
    } catch (e) {}
    console.log(`Treasury`);
    console.log(
        `   Program ID: ${helper.config.treasury.programId} (${
            loaded ? 'program loaded' : 'program not found'
        })`
    );
    console.log(
        `       Period: ${helper.config.treasury.vestedPeriod} seconds`
    );
    console.log(
        `   Percentage: ${helper.config.treasury.vestedPercentage / 100} %`
    );
    console.log();

    const funder = await helper.getFunderPublicKey();
    const balance = await helper.connection.getBalance(funder);

    console.log(`Keys`);
    console.log(
        `   Funder: ${funder.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`
    );

    const { mint, authority } = await helper.getMintKeys();
    const mintExists = connected
        ? null !== (await helper.connection.getAccountInfo(mint.publicKey))
        : false;
    console.log(
        `   Zee Mint: ${mint.publicKey.toBase58()} (${
            mintExists ? 'exists' : 'does not exist yet'
        })`
    );
    console.log(`   Zee Mint Authority: ${authority.publicKey.toBase58()}`);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
