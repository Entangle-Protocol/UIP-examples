import * as anchor from "@coral-xyz/anchor";
import { getMessagesBySender } from "../helpers/messenger";
import { hexToBytes } from "../helpers/endpoint";
import { formatChainId } from "../helpers/utils";
import { PublicKey } from "@solana/web3.js";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 1) {
    console.error("Usage: getMessagesBySender <sender>");
    process.exit(1);
  }

  const senderStr = process.argv[2];
  let senderVec: Buffer;

  if (senderStr.startsWith("0x")) {
    senderVec = hexToBytes(senderStr);
    if (senderVec.length == 20) {
      senderVec = Buffer.concat([Buffer.alloc(12), senderVec]);
    }
  } else {
    senderVec = new PublicKey(senderStr).toBuffer();
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const messages = await getMessagesBySender(provider.connection, senderVec);
  messages.sort((a, b) => a.messageId.toNumber() - b.messageId.toNumber());

  for (const { text, sourceChain, messageTimestamp } of messages) {
    const sourceChainFormatted = formatChainId(sourceChain);
    const date = new Date(1000 * messageTimestamp.toNumber());
    console.log(
      `${date.toLocaleDateString("en-US")} ${
        date.toLocaleTimeString("en-US")
      } | ${senderStr} (${sourceChainFormatted}): ${text}`,
    );
  }
}

main();
