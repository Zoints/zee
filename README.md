# Launch ZEE

The process of launching ZEE is a four step process.

## Setup

TBD


## Step 1 - Create Token

Creates the Mint account and initializes the SPL Token Mint. This creates the `MINT` variable for the next steps.

## Step 2 - Deploy and Initialize Programs

The `treasury` and `staking` program should be deployed on the network separately. The config for the environment needs to be updated with the respective treasury program id and staking program id. The two programs can be initialized using the `MINT` from Step 1.

## Step 3 - Pay out

By this step, the `treasury` and `staking` programs need to be deployed and initialized.

The amounts specified in the config file are paid out.

## Step 4 - Cap Token Supply

If steps one to three were successful, step 4 removes the mint authority, capping the token's supply permanently. After this step, it will no longer be possible to fix any mistakes.