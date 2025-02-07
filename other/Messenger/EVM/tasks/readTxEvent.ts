import { task } from "hardhat/config";

task("proposal", "Prints proposal data from a given transaction")
    .addParam("tx", "transaction hash")
    .setAction(async (taskArgs, { network, ethers }) => {
        // get network name 
        const netname = network.name
        const tx = taskArgs.tx;
        console.log(`Using network: ${netname}`)
        console.log(`Reading proposal event from tx: ${tx}`);
        
        const receipt = await ethers.provider.getTransactionReceipt(tx);
        const contractABI =
            require("../artifacts/@entangle-labs/uip-contracts/contracts/endpoint/Endpoint.sol/Endpoint.json").abi;
        const iface = new ethers.Interface(contractABI);

        // Filter logs for the 'Propose' event
        const proposeEvent = receipt!.logs
            .map((log) => {
                try {
                    return iface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter((event) => event && event.name === "MessageProposed");

        // Log the event data
        const fields = ["Chain id: ", "Msg.value: ", "Selector slot: ", "Agent parameters: ", "Sender address: ", "Destination address: ", "Encoded payload: "]
        proposeEvent.forEach((event) => {
            event!.args.forEach((elem) => {
                console.log(fields[event!.args.indexOf(elem)], elem);
            })
        });
    });
