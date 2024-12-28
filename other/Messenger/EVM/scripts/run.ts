const { proposeOperation } = require ("./messenger");

async function run() {
    const dest_chain_id = "1"
    const dest_address = "0xc3920857F6F5521A95ADe360De48C5839faCE0FF"
    const message = "pavapeppe"
    await proposeOperation(parseInt(dest_chain_id), dest_address, message);
        console.log(`Operation proposed to chain ${dest_chain_id} "at address" ${dest_address} with message: "${message}"`);
    
}