import fs from "fs";

function saveDeploymentAddress(
    network: string,
    contractName: string,
    address: string,
    impl: string
) {
    const folderPath = `./addresses/${network}`;
    const filePath = `./addresses/${network}/${contractName}.json`;
    // check folder with network name exists in addresses folder
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    // check if file with contract name exists
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
            filePath,
            JSON.stringify({ address: address, impl: impl }, null, 2)
        );
    } else {
        // read file then update and save
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        data.address = address;
        data.impl = impl;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    if (network !== "hardhat") {
        console.log(`\nData successfully saved to ${filePath}`);
        console.log("=================================== \n\n\n")
    }
}

function loadDeploymentAddress(network: string, contractName: string, silent: boolean = false) {
    const filePath = `./addresses/${network}/${contractName}.json`;
    console.log(`Deployment address loaded from
        ${filePath}   
    `)
    return JSON.parse(fs.readFileSync(filePath, "utf8")).address;
}

function upgradeImplAddress(filePath: string, newAddress: string) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    data.impl = newAddress;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log("New implementation address saved to:\t", filePath);
}

const networks = new Map<number, string>([
    [33133, "teib"],
    [11155111, "ethereum_sepolia"],
    [80002, "polygon_amoy"],
    [5003, "mantle_sepolia"],
    [84532, "base_sepolia"],
    [57054, "sonic_blaze"],
    [43113, "avalanche_fuji"],
    [1, "ethereum_mainnet"],
    [146, "sonic_mainnet"]
]);

export { 
    saveDeploymentAddress,
    loadDeploymentAddress,
    upgradeImplAddress,
    networks
};