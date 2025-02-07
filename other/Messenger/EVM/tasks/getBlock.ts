import { task } from "hardhat/config";

task("getBlock", "Prints block data from a given network")
    .addOptionalParam("num", "block number")
    .setAction(async (taskArgs, { network, ethers }) => {
        // get network name 
        const netname = network.name
        console.log(`Using network: ${netname}`)

        let blockNum: number | string;
        if (!taskArgs.num) {
            blockNum = "latest";
        } else {
            blockNum = Number(taskArgs.num);
        }
        console.log(`Reading block: ${blockNum}`);

        // parse block
        const data = await ethers.provider.getBlock(blockNum);
        console.log(`\nNumber:\t ${data?.number}`);
        console.log(`Hash:\t ${data?.hash}`);
        console.log(`Time:\t ${data?.timestamp}`)
    });
