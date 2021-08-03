import config from 'config';
// add vault later
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    Token,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import assert from 'assert';
import NodeVault from 'node-vault';

const connection = new Connection(
    config.get('solana.url'),
    config.get('solana.commitment')
);

const SUPPLY = 10_000_000_000_000;

const distribution = [
    {
        name: 'Team',
        amount: 1_400_000_000_000,
        address: 'todo111111111111111111111111111111111111111'
    },
    {
        name: 'Early Adopters',
        amount: 700_000_000_000,
        address: 'todo211111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsDevOps',
        amount: 2_000_000_000_000,
        address: 'todo311111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsBizDev',
        amount: 1_600_000_000_000,
        address: 'todo411111111111111111111111111111111111111'
    },
    {
        name: 'Staking',
        amount: 3_600_000_000_000,
        address: 'todo511111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsMarketing',
        amount: 200_000_000_000,
        address: 'todo611111111111111111111111111111111111111'
    },
    {
        name: 'z/ZointsSupport',
        amount: 400_000_000_000,
        address: 'todo711111111111111111111111111111111111111'
    },
    {
        name: 'ZAI Reward Fund',
        amount: 100_000_000_000,
        address: 'todo811111111111111111111111111111111111111'
    }
];

(async () => {
    const vault = await loadVault();

    const secret = await vault.read('secret/data/zee');

    const funder = Keypair.fromSecretKey(
        Buffer.from(secret.data.data.funder, 'base64')
    );
    const mint = Keypair.fromSecretKey(
        Buffer.from(secret.data.data.mint, 'base64')
    );
    const mintAuthority = Keypair.fromSecretKey(
        Buffer.from(secret.data.data.mintAuthority, 'base64')
    );

    const distribute: {
        name: string;
        amount: number;
        address: PublicKey;
        assoc: PublicKey;
    }[] = [];

    let total = 0;
    for (let item of distribution) {
        const address = new PublicKey(item.address); // verifies valid address
        const assoc =
            // spl-token library off-curve addresses in 0.1.6 is bugged
            (
                await PublicKey.findProgramAddress(
                    [
                        address.toBuffer(),
                        TOKEN_PROGRAM_ID.toBuffer(),
                        mint.publicKey.toBuffer()
                    ],
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            )[0];

        distribute.push({
            name: item.name,
            amount: item.amount,
            address,
            assoc
        });

        total += item.amount;
    }

    assert(total === SUPPLY);

    const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
        connection
    );
    const transaction = new Transaction()
        .add(
            SystemProgram.createAccount({
                fromPubkey: funder.publicKey,
                newAccountPubkey: mint.publicKey,
                lamports: balanceNeeded,
                space: MintLayout.span,
                programId: TOKEN_PROGRAM_ID
            })
        )
        .add(
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                mintAuthority.publicKey,
                null
            )
        );

    const sig = await sendAndConfirmTransaction(connection, transaction, [
        funder,
        mint
    ]);
    console.log(`Mint initialized: ${sig}`);

    const mintInstruction = new Transaction();
    for (let item of distribute) {
        mintInstruction.add(
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                item.assoc,
                item.address,
                funder.publicKey
            )
        );
        mintInstruction.add(
            Token.createMintToInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                item.assoc,
                mintAuthority.publicKey,
                [],
                item.amount
            )
        );
    }

    mintInstruction.add(
        Token.createSetAuthorityInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            null,
            'MintTokens',
            mintAuthority.publicKey,
            []
        )
    );

    const sig2 = await sendAndConfirmTransaction(connection, mintInstruction, [
        funder,
        mintAuthority
    ]);
    console.log(`Tokens paid out and mint removed: ${sig2}`);

    const token = new Token(
        connection,
        mint.publicKey,
        TOKEN_PROGRAM_ID,
        funder
    );

    for (let item of distribute) {
        const balance = await token.getAccountInfo(item.assoc);
        assert(balance.amount.toNumber() === item.amount);
    }
    console.log(`Token balances verified`);

    const mintInfo = await token.getMintInfo();
    assert(mintInfo.mintAuthority === null);
})();

async function loadVault(): Promise<NodeVault.client> {
    let vault: NodeVault.client;
    if (process.env.NODE_ENV === 'dev') {
        vault = NodeVault({
            apiVersion: 'v1',
            endpoint: config.get('vault.url'),
            token: config.get('vault.token')
        });

        const funder = new Keypair();
        const mint = new Keypair();
        const mintAuthority = new Keypair();

        await connection.requestAirdrop(funder.publicKey, 2 * LAMPORTS_PER_SOL);

        while ((await connection.getBalance(funder.publicKey)) == 0) {
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 1000);
            });
        }
        console.log(`Airdropped 2 SOL to ${funder.publicKey.toBase58()}`);

        await vault.write('secret/data/zee', {
            data: {
                funder: Buffer.from(funder.secretKey).toString('base64'),
                mint: Buffer.from(mint.secretKey).toString('base64'),
                mintAuthority: Buffer.from(mintAuthority.secretKey).toString(
                    'base64'
                )
            }
        });
    } else {
        vault = NodeVault({ endpoint: config.get('vault.url') });
        await vault.approleLogin({
            role_id: config.get('vault.role_id'),
            secret_id: config.get('vault.secret_id')
        });
    }
    return vault;
}
