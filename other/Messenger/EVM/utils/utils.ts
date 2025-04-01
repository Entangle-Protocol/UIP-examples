import fs from "fs";

function loadDeploymentAddress(network: string, contractName: string) {
    const filePath = `./addresses/${network}/${contractName}.json`;
    console.log(`Deployment address loaded from
        ${filePath}   
    `)
    return JSON.parse(fs.readFileSync(filePath, "utf8")).address;
}

async function hexToString(hex: any) {
    hex = hex.replace(/^0x/, '');
    
    let bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        const char = parseInt(hex.substr(i, 2), 16)
        if (char >= 32 && char <= 126) {
            bytes.push(String.fromCharCode(char));
        }
    }
    
    return bytes.join('').trim();
}

export {
    loadDeploymentAddress,
    hexToString
}