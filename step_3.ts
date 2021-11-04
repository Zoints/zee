import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { Staking } from '@zoints/staking';
import { Settings, Treasury } from '@zoints/treasury';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT STEP 3`);
console.log(`==========================`);
(async () => {
    const helper = await CreateHelper();
    await helper.verifyBlockchain();
    const { mint, authority } = await helper.getMintKeys();

    const staking = new Staking(
        helper.config.staking.programId,
        helper.connection
    );
    const rewardPool = await staking.rewardPoolId();
    const rewardPoolExists = await helper.connection.getAccountInfo(rewardPool);
    if (rewardPoolExists === null) {
        throw new Error(`Staking program has not been initialized`);
    }
    const stakingSettings = await staking.getSettings();
    if (!stakingSettings.token.equals(mint.publicKey)) {
        throw new Error(
            `Staking program has been initialized for a different mint`
        );
    }

    const treasury = new Treasury(
        helper.connection,
        helper.config.treasury.programId
    );
    let treasurySettings: Settings;
    try {
        treasurySettings = await treasury.getSettings();
    } catch (e) {
        throw new Error(`Treasury program has not been initialized`);
    }
    if (!treasurySettings.token.equals(mint.publicKey)) {
        throw new Error(
            `Treasury program has been initialized for a different mint`
        );
    }

    console.log(`Staking Reward Pool`);
    console.log(`   Reward Pool Account: ${rewardPool.toBase58()}`);
    console.log(`                Amount: ${helper.config.staking.rewardPool}`);
    console.log();

    const rewardTx = new Transaction().add(
        Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            rewardPool,
            authority.publicKey,
            [],
            helper.config.staking.rewardPool
        )
    );

    // await helper.signAndVerify(rewardTx);
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
