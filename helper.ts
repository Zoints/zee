import { Connection, PublicKey } from '@solana/web3.js';
import NodeVault from 'node-vault';
import { Config, getConfig, SUPPLY } from './config';

export class Helper {
    config: Config;
    connection: Connection;
    vault: NodeVault.client;

    constructor() {
        this.config = getConfig();
        this.connection = new Connection(
            this.config.solana.url,
            this.config.solana.commitment
        );

        if (this.config.vault.login === 'approle') {
            this.vault = NodeVault({
                endpoint: this.config.vault.url
            });
        } else {
            this.vault = NodeVault({
                apiVersion: 'v1',
                endpoint: this.config.vault.url,
                token: this.config.vault.token
            });
        }
    }

    public verify() {
        let sum = this.config.staking.rewardPool;
        for (const recipient of this.config.payout) {
            sum += recipient.direct + recipient.vested;
        }

        if (sum != SUPPLY) {
            throw new Error(
                `Configuration sum added up to: ${sum}, expected ${SUPPLY}`
            );
        }
    }

    public async verifyBlockchain() {
        await this.verifyProgramId('Staking', this.config.staking.programId);
        await this.verifyProgramId('Treasury', this.config.treasury.programId);
    }

    private async verifyProgramId(name: string, programId: PublicKey) {
        const account = await this.connection.getAccountInfo(programId);
        if (account === null) {
            throw new Error(
                `Unable to find the ${name} program on the blockchain`
            );
        }

        if (!account.executable) {
            throw new Error(
                `The ${name} account was found but is not an executable program`
            );
        }
    }
}

export async function CreateHelper(): Promise<Helper> {
    const helper = new Helper();
    helper.verify();
    await helper.vault.approleLogin({
        role_id: helper.config.vault.roleId,
        secret_id: helper.config.vault.secretId
    });
    return helper;
}
