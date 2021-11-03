import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey
} from '@solana/web3.js';
import NodeVault from 'node-vault';

const connection = new Connection('http://localhost:8899', 'confirmed');

const vault = NodeVault({
    apiVersion: 'v1',
    endpoint: 'http://localhost:8200',
    token: 'zoints'
});

const mint = new Keypair();
const mintAuthority = new Keypair();

console.log(`Mint: ${mint.publicKey.toBase58()}`);
console.log(`Mint Authority: ${mintAuthority.publicKey.toBase58()}`);

(async () => {
    try {
        await vault.mount({ mount_point: 'transit', type: 'transit' });
    } catch (e) {}
    await vault.write('transit/keys/development_zoints_funder', {
        type: 'ed25519'
    });

    const { data: funder } = await vault.read(
        'transit/keys/development_zoints_funder'
    );
    const pubkeyRaw = Buffer.from(
        funder.keys[funder.latest_version].public_key,
        'base64'
    );
    const pubkey = new PublicKey(pubkeyRaw);

    const sig = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL * 5);
    await connection.confirmTransaction(sig);
    console.log(`Airdropped 5 SOL to ${pubkey.toBase58()}`);

    await vault.write('secret/data/development_zee', {
        data: {
            mint: Buffer.from(mint.secretKey).toString('base64'),
            authority: Buffer.from(mintAuthority.secretKey).toString('base64')
        }
    });
})().then(() => process.exit(0));
