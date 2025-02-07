import { task } from "hardhat/config";

task("balance", "Prints an account's balance")
    .addParam("acc", "The account's address")
    .setAction(async (taskArgs, { network, ethers }) => {
        // get network name
        const netname = network.name;
        console.log(`Using network: ${netname}\n`);

        const balance = await ethers.provider.getBalance(taskArgs.acc);
        console.log(ethers.formatEther(balance), "native");
    });
