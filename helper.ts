import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import NodeVault from 'node-vault';
import { Config, getConfig, SUPPLY } from './config';

export class Helper {
    config: Config;
    connection: Connection;
    vault: NodeVault.client;

    funder: PublicKey | undefined;

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
            sum += recipient.direct.amount + recipient.vested.amount;
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

    public async verifyProgramId(name: string, programId: PublicKey) {
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

    public async getFunderPublicKey(): Promise<PublicKey> {
        if (this.funder === undefined) {
            const { data: funder } = await this.vault.read(
                `/transit/keys/${this.config.vault.funder}`
            );
            const pubkeyRaw = Buffer.from(
                funder.keys[funder.latest_version].public_key,
                'base64'
            );
            this.funder = new PublicKey(pubkeyRaw);
        }
        return this.funder;
    }

    public async signWithFunder(tx: Transaction): Promise<Transaction> {
        const funder = await this.getFunderPublicKey();

        const result = await this.vault.request({
            method: 'POST',
            path: `/transit/sign/${this.config.vault.funder}`,
            body: {
                input: tx.serializeMessage().toString('base64')
            }
        });

        const sig = Buffer.from(result.data.signature.split(':')[2], 'base64');
        tx.addSignature(funder, sig);

        return tx;
    }

    public async getMintKeys(): Promise<{ mint: Keypair; authority: Keypair }> {
        const { data: zee } = await this.vault.read(
            `/secret/data/${this.config.vault.zee}`
        );
        return {
            mint: Keypair.fromSecretKey(Buffer.from(zee.data.mint, 'base64')),
            authority: Keypair.fromSecretKey(
                Buffer.from(zee.data.authority, 'base64')
            )
        };
    }

    public async signAndVerify(tx: Transaction, additional?: Keypair[]) {
        const funder = await this.getFunderPublicKey();
        const { mint, authority } = await this.getMintKeys();

        tx.feePayer = funder;
        tx.recentBlockhash = (
            await this.connection.getRecentBlockhash()
        ).blockhash;

        tx = await this.signWithFunder(tx);

        for (const sigpair of tx.signatures) {
            if (sigpair.publicKey.equals(mint.publicKey)) {
                tx.partialSign(mint);
            }

            if (sigpair.publicKey.equals(authority.publicKey)) {
                tx.partialSign(authority);
            }
        }

        if (additional !== undefined) {
            tx.partialSign(...additional);
        }

        const txsig = await this.connection.sendRawTransaction(tx.serialize());
        console.log(`\nTransaction sent: ${txsig}`);

        const confirmation = await this.connection.confirmTransaction(txsig);
        if (confirmation.value.err !== null) {
            throw new Error(
                `Transaction confirmation failed: ${confirmation.value.err}`
            );
        } else {
            console.log(`Transaction confirmed`);
        }
    }
}

export async function CreateHelper(): Promise<Helper> {
    const helper = new Helper();
    helper.verify();
    if (helper.config.vault.login === 'approle') {
        await helper.vault.approleLogin({
            role_id: process.env.ROLE_ID,
            secret_id: process.env.SECRET_ID
        });
    }
    return helper;
}
