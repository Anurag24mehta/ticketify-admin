"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Account } from "thirdweb/wallets";
import { QrReader } from "react-qr-reader";
import { prepareContractCall, readContract, sendAndConfirmTransaction } from "thirdweb";
import { CONTRACT } from "@/blockchain/constants";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { QrcodeResult } from "html5-qrcode/core";

export default function Home() {
    const activeAccount = useActiveAccount();
    const [account, setAccount] = useState<Account | null>(null);
    const [tokenId, setTokenId] = useState<string | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            if (activeAccount) {
                try {
                    const owner = await readContract({
                        contract: CONTRACT,
                        method: "owner",
                        params: [],
                    });

                    if (owner === activeAccount.address) {
                        setAccount(activeAccount);
                    } else {
                        toast({
                            title: "Unauthorized",
                            description: "You are not authorized to access this page",
                            variant: "destructive",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching contract owner:", error);
                }
            }
        };
        checkAdmin();
    }, [activeAccount]);

    const handleExpire = async () => {
        if (!tokenId || isNaN(Number(tokenId))) {
            toast({
                title: "Error",
                description: "Invalid Token ID",
                variant: "destructive",
            });
            return;
        }

        if (!account) {
            console.log("No active account");
            return;
        }

        try {
            const bigIntTokenId = BigInt(tokenId);

            const isExpired = await readContract({
                contract: CONTRACT,
                method: "ticketExpired",
                params: [bigIntTokenId],
            });

            if (isExpired) {
                toast({
                    title: "Error",
                    description: "Ticket already expired",
                    variant: "destructive",
                });
                return;
            }

            const transaction = await prepareContractCall({
                contract: CONTRACT,
                method: "setTicketExpired",
                params: [bigIntTokenId],
            });

            const loadingToast = toast({
                title: "Transaction in progress",
                description: "Please wait while your transaction is being processed...",
                duration: Infinity,
            });

            const receipt = await sendAndConfirmTransaction({
                transaction,
                account,
            });

            if (!receipt) {
                toast({
                    title: "Transaction Failed",
                    description: "Something went wrong. Please try again.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Transaction Successful",
                    description: "Ticket expired successfully!",
                });
            }
        } catch (error) {
            console.error("Transaction error:", error);
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Scan the Ticket QR Code</h2>
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-4 border">
                <QrReader
                    onResult={(result: QrcodeResult, error: Error) => {
                        if (result?.text) {
                            setTokenId(result.text);
                        }
                        if (error) {
                            console.info(error);
                        }
                    }}
                    className="w-full rounded-md"
                />
                <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Token ID: <span className="text-blue-600">{tokenId ?? "No QR code scanned"}</span>
                    </h3>
                    <Button
                        onClick={handleExpire}
                        disabled={!tokenId}
                        className="mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
                    >
                        Mark Expired
                    </Button>
                </div>
            </div>
        </div>
    );
}
