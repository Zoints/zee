import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { Treasury } from '@zoints/treasury';

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const programId = new PublicKey('4HrHfcxXjBG8yMpwcjy1oe9HVwG2dwgmErcq2kTuRBNR');

const treasuries = [
    'HGCroDGnuJyNiiW4BTPmFJq1nuNravW5sPvJB1DLnEFb',
    'KZvkQxVn2cETRtQ6gMZLit5rPLA6ygyhncnyj7whZWn',
    'CWar8tG6zcgXAgK3LLF9xhuewf4QJrmvrh36DXde2bMt',
    '9aWLQBzEbxTybkeLzNAQpz23pSNTR6G97cV3s86S5TCW',
    'Ed7jAyoMB1VWBTNqnHpJHeMLjYnYcS5eWxSNWNhAP8ok',
    'Bj51H2wGJV1ipmogxQ683Xna2BnfgUYumF99yT5F5fNg',
    'FXUdkVEA2XgnzxYH6bBZEbSVYhy1wTxvU6LNjS6KTkj4',
    '6DsGFZkghYd54CY4tTRpNbJM29HUUgA7NEPEf5ztSQ7m',
    '9wyA79GvQgyGUA4w9jRFWjS1Edxt1i9Go7C3z7eDZUP1',
    'Aua1JYLcxSmtsudA7L8p8ZpSfGYQgWR4GCj5qzRG1P9n',
    'AsdvTqfSnX9WspFfcfRsKgTj3RxZ9Yf1WBLKZaoFgTjv',
    'Ffa8PoiBPZGt8VhAmhhNkipS6yShthbFcVArPY7KGd1m',
    '5uU6SfME38EPbib4cY1yzjRTLeSpM82XRh4VBbLn3TcR',
    'MxZVeduExJVp2BzVX4RXe7LZiSsGAipHNV22AFmtYiN',
    'DbQGJPCD6EsQjJ6oZssLGYbuJo26VHdb8ozLqgrww1vF'
];

(async () => {
    const treasury = new Treasury(connection, programId);

    for (const raw of treasuries) {
        const id = new PublicKey(raw);
        console.log(`Treasury ${raw}`);
        console.log(`=================================`);
        try {
            const vested = await treasury.getVestedTreasury(id);
            console.log(`            mint: ${vested.mint.toBase58()}`);
            console.log(`       authority: ${vested.authority.toString()}`);
            console.log(`  initial amount: ${vested.initialAmount.toString()}`);
            console.log(`       withdrawn: ${vested.withdrawn.toString()}`);
            console.log(`      start date: ${vested.start}`);
            console.log(
                `      percentage: ${vested.vestmentPercentage / 10_000}`
            );
            console.log(
                `          period: ${vested.vestmentPeriod.toString()} seconds`
            );
            const assoc = await Treasury.vestedTreasuryAssociatedAccount(
                id,
                vested.mint,
                programId
            );
            const fund = await connection.getTokenAccountBalance(assoc.fund);
            console.log(`    fund address: ${assoc.authority.toBase58()}`);
            console.log(`    actual funds: ${fund.value.amount} ZEE`);
        } catch (e) {
            console.error(raw);
            console.error(e);
        }
        console.log();
    }
})().then(() => process.exit(0));
