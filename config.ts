import config from 'config';
import { Cluster, clusterApiUrl, Commitment, PublicKey } from '@solana/web3.js';

export interface Payout {
    name: string;
    address: PublicKey;
    direct: number;
    vested: number;
}

export interface Config {
    solana: {
        url: string;
        commitment: Commitment;
    };
    treasury: {
        programId: PublicKey;
        vestedPeriod: number;
        vestedPercentage: number;
    };
    staking: {
        programId: PublicKey;
        rewardPool: number;
    };
    payout: Payout[];
}

export function getConfig(): Config {
    let solanaURL = config.get<string>('solana.url');
    try {
        solanaURL = clusterApiUrl(solanaURL as Cluster);
    } catch (e) {}

    const solanaCommitment = config.get<string>(
        'solana.commitment'
    ) as Commitment;

    const treasuryProgramId = new PublicKey(
        config.get<string>('treasury.programId')
    );
    const treasuryVestedPeriod = Number(
        config.get<number>('treasury.vestedPeriod')
    );
    if (treasuryVestedPeriod < 1) {
        throw new Error(`invalid treasury vested period`);
    }

    const treasuryVestedPercentage = Number(
        config.get<number>('treasury.vestedPercentage')
    );

    if (treasuryVestedPercentage < 1 || treasuryVestedPercentage > 10_000) {
        throw new Error(`invalid treasury vested percentage`);
    }

    const stakingProgramId = new PublicKey(
        config.get<string>('staking.programId')
    );
    const stakingRewardPool = Number(config.get<number>('staking.rewardPool'));

    const payout: Payout[] = [];
    for (const i of config.get<any[]>('payout')) {
        const item = {
            name: i.name,
            address: new PublicKey(i.address),
            direct: Number(i.direct),
            vested: Number(i.vested)
        };
        payout.push(item);
    }

    return {
        solana: { url: solanaURL, commitment: solanaCommitment },
        treasury: {
            programId: treasuryProgramId,
            vestedPeriod: treasuryVestedPeriod,
            vestedPercentage: treasuryVestedPercentage
        },
        staking: { programId: stakingProgramId, rewardPool: stakingRewardPool },
        payout
    };
}
