// We're adding these
import * as Web3 from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function airdropSolIfNeeded(
    signer: Web3.Keypair,
    connection: Web3.Connection
) {
    const balance = await connection.getBalance(signer.publicKey);
    console.log('Current balance is', balance / Web3.LAMPORTS_PER_SOL, 'SOL');

    // 1 SOL should be enough for almost anything you wanna do
    if (balance / Web3.LAMPORTS_PER_SOL < 1) {
        // You can only get up to 2 SOL per request 
        console.log('Airdropping 1 SOL');
        const airdropSignature = await connection.requestAirdrop(
            signer.publicKey,
            Web3.LAMPORTS_PER_SOL
        );

        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: airdropSignature,
        });

        const newBalance = await connection.getBalance(signer.publicKey);
        console.log('New balance is', newBalance / Web3.LAMPORTS_PER_SOL, 'SOL');
    }
}

async function initializeKeypair(connection: Web3.Connection, isAirdropNeeded: boolean): Promise<Web3.Keypair> {

    console.log('Generating new keypair... 🗝️');
    const signer = Web3.Keypair.generate();

    if(isAirdropNeeded){
        await airdropSolIfNeeded(signer, connection);
    }
    console.log("Public key:", signer.publicKey.toBase58());
    return signer;
}

async function trasnfer(fromKeypair: Web3.Keypair, toKeypair: Web3.Keypair,
    connection: Web3.Connection) {
    const instruction = Web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toKeypair.publicKey,
        lamports: Web3.LAMPORTS_PER_SOL * 0.5
    });

    const transaction = new Web3.Transaction();
    transaction.add(instruction);

    const transactionSignature = await Web3.sendAndConfirmTransaction(connection, transaction, [fromKeypair])

    console.log(
        `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}

async function main() {
    const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'));
    const fromKeypair = await initializeKeypair(connection, true);
    const toKeypair = await initializeKeypair(connection, false);
    await trasnfer(fromKeypair, toKeypair, connection);
 }

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
