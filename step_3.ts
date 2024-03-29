import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    Token,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { Keypair, Transaction } from '@solana/web3.js';
import { Staking } from '@zoints/staking';
import { Treasury, TreasuryInstruction } from '@zoints/treasury';
import { CreateHelper } from './helper';

console.log(`ZEE DEPLOYMENT STEP 3`);
console.log(`==========================`);
(async () => {
    const helper = await CreateHelper();
    await helper.verifyBlockchain();
    const funder = await helper.getFunderPublicKey();
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

    await helper.signAndVerify(rewardTx);

    for (const payout of helper.config.payout) {
        const tx = new Transaction();
        const additionalSigners: Keypair[] = [];

        console.log(`Payout for ${payout.name}`);
        console.log(`================================`);
        if (payout.direct.amount > 0) {
            const assoc = await Token.getAssociatedTokenAddress(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                payout.direct.address,
                true
            );
            tx.add(
                Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    assoc,
                    payout.direct.address,
                    funder
                ),
                Token.createMintToInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    assoc,
                    authority.publicKey,
                    [],
                    payout.direct.amount
                )
            );

            console.log(`    Direct: ${payout.direct.amount} ZEE`);
            console.log(`   Address: ${payout.direct.address.toBase58()}`);
            console.log(``);
        }

        if (payout.vested.amount > 0) {
            const treasury = new Keypair();
            additionalSigners.push(treasury);

            const treasuryAssoc =
                await Treasury.vestedTreasuryAssociatedAccount(
                    treasury.publicKey,
                    mint.publicKey,
                    helper.config.treasury.programId
                );

            tx.add(
                ...(await TreasuryInstruction.CreateVestedTreasuryAndFundAccount(
                    helper.config.treasury.programId,
                    mint.publicKey,
                    funder,
                    treasury.publicKey,
                    payout.vested.address,
                    BigInt(payout.vested.amount),
                    BigInt(helper.config.treasury.vestedPeriod),
                    helper.config.treasury.vestedPercentage
                )),
                Token.createMintToInstruction(
                    TOKEN_PROGRAM_ID,
                    mint.publicKey,
                    treasuryAssoc.fund,
                    authority.publicKey,
                    [],
                    payout.vested.amount
                )
            );

            console.log(` Treasury: ${treasury.publicKey.toBase58()}`);
            console.log(`   Vested: ${payout.vested.amount} ZEE`);
            console.log(`  Address: ${payout.vested.address.toBase58()}`);
            console.log(``);
        }

        await helper.signAndVerify(tx, additionalSigners);
        console.log(`================================`);
        console.log();
    }
})()
    .catch((e) => console.error(`FATAL ERROR: ${e.message}`))
    .then(() => process.exit(0));
