

export function getMessageStatus(statusCode: bigint) {
    switch (statusCode) {
        case 0n: return { statusString: "NOT_INITIALIZED", zone: "default" };
        case 1n: return { statusString: "INVALID", zone: "consensus" };
        case 2n: return { statusString: "SAVED", zone: "consensus" };
        case 3n: return { statusString: "TRANSMITTED", zone: "consensus" };
        case 4n: return { statusString: "QUEUED", zone: "consensus" };
        case 5n: return { statusString: "PENDING", zone: "executor" };
        case 6n: return { statusString: "PROTOCOL_FAILED", zone: "executor" };
        case 7n: return { statusString: "EXTENSION_NOT_REGISTERED", zone: "executor" };
        case 8n: return { statusString: "EXTENSION_NOT_REACHABLE", zone: "executor" };
        case 9n: return { statusString: "EXTENSION_PANICKED", zone: "executor" };
        case 10n: return { statusString: "UNDERESTIMATED", zone: "delivery" };
        case 11n: return { statusString: "SUCCESS", zone: "delivery" };
        case 12n: return { statusString: "FAILED", zone: "delivery" };
        case 13n: return { statusString: "OUT_OF_GAS", zone: "delivery" };

        default: return { statusString: "UNKNOWN", zone: "UNKNOWN" };
    }
}