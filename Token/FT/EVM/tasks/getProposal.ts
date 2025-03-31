import { task } from "hardhat/config";

task("getProposal", "Prints proposal data from a given transaction")
    .addParam("hash", "transaction hash")
    .setAction(async (taskArgs, { network, ethers }) => {
        const netname = network.name
        const tx = taskArgs.hash;
        console.log(`Using network: ${netname}`)
        console.log(`Reading proposal event from tx: ${tx}`);
        
        const receipt = await ethers.provider.getTransactionReceipt(tx);
        const contractABI =
            require("../artifacts/@entangle-labs/uip-contracts/contracts/endpoint/Endpoint.sol/Endpoint.json").abi;
        const iface = new ethers.Interface(contractABI);

        const proposeEvent = receipt!.logs
            .map((log) => {
                try {
                    return iface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter((event) => event && event.name === "MessageProposed");

        const fields = ["Chain id: ", "Msg.value: ", "Selector slot: ", "Agent parameters: ", "Sender address: ", "Destination address: ", "Encoded payload: ", "Reserved: "]
        proposeEvent.forEach((event) => {
            event!.args.forEach((elem) => {
                console.log(fields[event!.args.indexOf(elem)], elem);
            })
        });
    });

