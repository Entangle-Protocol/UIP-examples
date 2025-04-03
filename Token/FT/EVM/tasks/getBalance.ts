import { task } from "hardhat/config";

task("getBalance", "Prints an account's balance")
    .addParam("acc", "The account's address")
    .setAction(async (taskArgs, { network, ethers }) => {
        const netname = network.name;
        console.log(`Using network: ${netname}\n`);

        const balance = await ethers.provider.getBalance(taskArgs.acc);
        console.log(ethers.formatEther(balance), "native");
    });

