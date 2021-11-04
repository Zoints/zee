import config from 'config';
import { Cluster, clusterApiUrl, Commitment, PublicKey } from '@solana/web3.js';

export const SUPPLY = 10_000_000_000_000;

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
    vault: {
        url: string;
        login: 'token' | 'approle';
        funder: string;
        zee: string;
        token?: string;
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

    const vaultLogin = config.get<string>('vault.login');
    let vault: any = {
        url: config.get<string>('vault.url'),
        funder: config.get<string>('vault.funder'),
        zee: config.get<string>('vault.zee')
    };
    switch (vaultLogin) {
        case 'token':
            vault.login = 'token';
            vault.token = config.get<string>('vault.token');
            break;
        case 'approle':
            vault.login = 'approle';
            break;
        default:
            throw new Error('unsupported vault login');
    }

    const payout: Payout[] = [];
    for (const i of config.get<any[]>('payout')) {
        const item = {
            name: i.name,
            address: new PublicKey(i.address),
            direct: Number(i.direct),
            vested: Number(i.vested)
        };

        if (item.direct < 0) {
            throw new Error(
                `paying for "${item.name}" has negative direct payout`
            );
        }
        if (item.vested < 0) {
            throw new Error(
                `paying for "${item.name}" has negative vested payout`
            );
        }

        if (item.direct + item.vested == 0) {
            throw new Error(
                `payout for "${item.name}" has neither direct nor vested payout`
            );
        }

        payout.push(item);
    }

    return {
        solana: { url: solanaURL, commitment: solanaCommitment },
        vault,
        treasury: {
            programId: treasuryProgramId,
            vestedPeriod: treasuryVestedPeriod,
            vestedPercentage: treasuryVestedPercentage
        },
        staking: { programId: stakingProgramId, rewardPool: stakingRewardPool },
        payout
    };
}
