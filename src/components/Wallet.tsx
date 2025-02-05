import {ConnectButton} from "thirdweb/react";
import {chain, client} from "../blockchain/constants";

export function Wallet() {
    return(
        <div>
            <ConnectButton
                client={client}
                chain={chain}
            >
            </ConnectButton>
        </div>
    )
}