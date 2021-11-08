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

// testkeys/mint.json
const mint = Keypair.fromSecretKey(
    Buffer.from([
        169, 240, 97, 86, 186, 168, 49, 233, 49, 11, 129, 65, 167, 65, 52, 243,
        134, 62, 89, 208, 173, 114, 204, 133, 199, 190, 111, 43, 68, 227, 18,
        173, 228, 239, 124, 104, 179, 217, 133, 174, 252, 246, 225, 152, 40,
        192, 249, 119, 95, 128, 199, 10, 215, 177, 235, 82, 163, 17, 23, 141, 0,
        15, 220, 145
    ])
);

// testkeys/mintAuthority.json
const mintAuthority = Keypair.fromSecretKey(
    Buffer.from([
        167, 221, 133, 234, 239, 193, 132, 52, 112, 140, 91, 42, 144, 94, 75,
        203, 241, 32, 33, 118, 218, 96, 212, 221, 209, 166, 34, 207, 141, 119,
        220, 11, 48, 119, 4, 116, 135, 180, 175, 216, 176, 74, 0, 140, 15, 96,
        1, 13, 22, 45, 40, 80, 174, 133, 189, 238, 148, 95, 252, 39, 36, 129,
        60, 215
    ])
);

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
