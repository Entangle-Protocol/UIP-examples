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

export { 
    saveDeploymentAddress,
    loadDeploymentAddress
};