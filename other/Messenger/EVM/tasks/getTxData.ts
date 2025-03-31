import { task } from "hardhat/config";

task("getTxData", "Get transaction data")
    .addParam("hash", "transaction hash")
    .setAction(async (taskArgs, { network, ethers }) => {
        // get network name 
        const netname = network.name
        const tx = taskArgs.tx;

        console.log(`Using network: ${netname}`)
        console.log(`Reading data from tx: ${tx}`);
        
        let txData
        try {
            txData = await ethers.provider.getTransaction(tx);
        } catch (e) {
            console.log("Transaction not found")
            return
        }

        if (txData) {
            console.log(`
                From: ${txData.from}
                To: ${txData.to}
                Value: ${txData.value}
                Data: ${txData.data}
                Block: ${txData.blockNumber}
            `)
        }
    });
