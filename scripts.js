let _contractAddress = "0x3B22A5fb8DAB45287272D76c6A89805633029774";

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");

    const backBtn = document.getElementById("back-btn");

    if (backBtn) {
        backBtn.addEventListener("click", function() {
            window.history.back();
        });
    }

    // Wallet Connection
    const connectButton = document.getElementById('connectWalletButton');
    const walletInfoDiv = document.getElementById('walletInfo');
    const accountAddressSpan = document.getElementById('accountAddress');
    const disconnectButton = document.getElementById('disconnectWalletButton');

    // Check if wallet is already connected on page load
    window.addEventListener('load', async function() {
        console.log("Window loaded");
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log("Wallet already connected:", accounts[0]);
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const accountAddress = await signer.getAddress();
                    updateUIOnConnect(accountAddress);
                    await updateBalances();
                    await updateAccessList(); 
                }
            } catch (error) {
                console.error("An error occurred while checking wallet connection:", error);
            }
        }
    });

    connectButton.addEventListener('click', async function() {
        console.log("Connect wallet button clicked");
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log("Wallet connected:", accounts[0]);
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const accountAddress = await signer.getAddress();
                updateUIOnConnect(accountAddress);
                await updateBalances();
            } catch (error) {
                console.error("User denied account access or an error occurred:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    });

    disconnectButton.addEventListener('click', function() {
        console.log("Disconnect wallet button clicked");
        walletInfoDiv.style.display = 'none';
        connectButton.style.display = 'block';
        accountAddressSpan.textContent = '';
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts', params: [{ eth_accounts: {} }] });
        }
    });

    // Function to update UI on wallet connect
    function updateUIOnConnect(accountAddress) {
        console.log("Updating UI on wallet connect");
        connectButton.style.display = 'none';
        walletInfoDiv.style.display = 'flex';
        walletInfoDiv.style.alignItems = 'center';
        walletInfoDiv.style.justifyContent = 'space-between';
        accountAddressSpan.textContent = `Connected: ${accountAddress}`;
    }

    // Check URL Parameters for Operations
    const urlParams = new URLSearchParams(window.location.search);
    const operation = urlParams.get('operation');

    if (operation) {
        handleOperation(operation);
    }

    // Function to handle operations
    async function handleOperation(operation) {
        const operationTitle = document.getElementById("operation-title");
        const operationForm = document.getElementById("operation-form");
        const formTitle = document.getElementById("form-title");
    
        operationTitle.textContent = `Perform ${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
        formTitle.textContent = `${operation.charAt(0).toUpperCase() + operation.slice(1)} Amount`;
    
        operationForm.style.display = 'block';
    
        // Likidite işlemleri
        if (operation === 'addLiquidity' || operation === 'withdrawLiquidity') {
            await updateLiquidity();
            document.getElementById('liquidity-info').style.display = 'block';
        } else {
            document.getElementById('liquidity-info').style.display = 'none';
        }
    
        await updateBalances();
    
        // Alıcı adresi gerektiren işlemler
        const recipientAddressElement = document.getElementById('recipient-address');
        if (operation === 'send' || operation === 'withdrawOther' || operation === 'depositFor') {
            if (recipientAddressElement) {
                recipientAddressElement.style.display = 'block';
            }
        } else {
            if (recipientAddressElement) {
                recipientAddressElement.style.display = 'none';
            }
        }
    }

    // Confirm Operation
    window.confirmOperation = async function() {
        const amount = document.getElementById('operation-amount').value;
        const recipientElement = document.getElementById('recipient-address');
        const recipient = recipientElement ? recipientElement.value : null;
        const operation = urlParams.get('operation');
    
        if (!amount) {
            alert("Amount is required.");
            return;
        }
    
        if ((operation === 'send' || operation === 'withdrawOther' || operation === 'depositFor') && !recipient) {
            alert("Recipient address is required for this operation.");
            return;
        }
    
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contractAddress = _contractAddress; 
                const abi = [
                    "function addLiquidity() external payable",
                    "function withdrawLiquidity(uint256) external",
                    "function deposit() external payable",
                    "function withdraw(uint256) external",
                    "function transferFromWallet(address to) external payable",
                    "function withdrawFor(address _address, uint256 amount) external",
                    "function depositFor(address _address) external payable"
                ];
                const contract = new ethers.Contract(contractAddress, abi, signer);
    
                if (operation === 'addLiquidity') {
                    const tx = await contract.addLiquidity({ value: ethers.utils.parseUnits(amount, 'ether') });
                    await tx.wait();
                    alert(`${amount} ETH added to liquidity successfully`);
                    await updateLiquidity();
                } else if (operation === 'withdrawLiquidity') {
                    const tx = await contract.withdrawLiquidity(ethers.utils.parseUnits(amount, 'ether'));
                    await tx.wait();
                    alert(`${amount} ETH withdrawn from liquidity successfully`);
                    await updateLiquidity();
                } else if (operation === 'deposit') {
                    const tx = await contract.deposit({ value: ethers.utils.parseUnits(amount, 'ether') });
                    await tx.wait();
                    alert(`${amount} ETH deposited successfully`);
                    await updateBalances();
                } else if (operation === 'withdraw') {
                    const tx = await contract.withdraw(ethers.utils.parseUnits(amount, 'ether'));
                    await tx.wait();
                    alert(`${amount} ETH withdrawn successfully`);
                    await updateBalances();
                } else if (operation === 'send') {
                    const tx = await contract.transferFromWallet(recipient, { value: ethers.utils.parseUnits(amount, 'ether') });
                    await tx.wait();
                    alert(`${amount} ETH sent to ${recipient} successfully`);
                    await updateBalances();
                } else if (operation === 'withdrawOther') {
                    const tx = await contract.withdrawFor(recipient, ethers.utils.parseUnits(amount, 'ether'));
                    await tx.wait();
                    alert(`${amount} ETH withdrawn successfully from ${recipient}`);
                    await updateBalances();
                } else if (operation === 'depositFor') {
                    const tx = await contract.depositFor(recipient, { value: ethers.utils.parseUnits(amount, 'ether') });
                    await tx.wait();
                    alert(`${amount} ETH deposited successfully to ${recipient}`);
                    await updateBalances();
                }
            } catch (error) {
                console.error("An error occurred during the operation:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    }

    // Cancel Operation
    window.cancelOperation = function() {
        document.getElementById('operation-form').style.display = 'none';
    }

    // Update Balances
    async function updateBalances() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();

                const contractAddress = _contractAddress;
                const abi = [
                    "function balances(address) view returns (uint256)"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);

                const balance = await contract.balances(address);
                document.getElementById('balance-info').style.display = 'block';
                document.getElementById('current-balance').textContent = ethers.utils.formatEther(balance);
            } catch (error) {
                console.error("An error occurred while fetching the balance:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    }


    // Update Liquidity
    async function updateLiquidity() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contractAddress = _contractAddress; 
                const abi = [
                    "function totalLiquidity() view returns (uint256)"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);

                const liquidity = await contract.totalLiquidity();
                document.getElementById('liquidity-info').style.display = 'block';
                document.getElementById('current-liquidity').textContent = ethers.utils.formatEther(liquidity);
            } catch (error) {
                console.error("An error occurred while fetching the liquidity:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    }

    // Coin Flip Game
    
    // Update balances (both user's and contract's) on UI
    async function updateBalances() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const accountAddress = await signer.getAddress();
                const contractAddress = _contractAddress; 
                const abi = [
                    "function balances(address) view returns (uint256)",
                    "function getTotalLiquidity() view returns (uint256)",
                    "function getAccessList(address) view returns (address[])"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);

                // Get user balance
                const balance = await contract.balances(accountAddress);
                const userBalanceElement = document.getElementById("userBalance");
                if (userBalanceElement) {
                    userBalanceElement.textContent = `Your Balance: ${ethers.utils.formatEther(balance)} ETH`;
                }

                // Get contract liquidity (if applicable)
                const liquidityElement = document.getElementById("contractLiquidity");
                if (liquidityElement) {
                    const liquidity = await contract.getTotalLiquidity();
                    liquidityElement.textContent = `Contract Liquidity: ${ethers.utils.formatEther(liquidity)} ETH`;
                }

                // Get access list (if applicable)
                const accessListElement = document.getElementById("accessList");
                if (accessListElement) {
                    const accessList = await contract.getAccessList(accountAddress);
                    accessListElement.innerHTML = "";
                    accessList.forEach(user => {
                        const listItem = document.createElement("li");
                        listItem.textContent = user;
                        const removeButton = document.createElement("button");
                        removeButton.textContent = "Revoke Access";
                        removeButton.onclick = async () => {
                            await contract.connect(signer).revokeAccess(user);
                            updateBalances(); 
                        };
                        listItem.appendChild(removeButton);
                        accessListElement.appendChild(listItem);
                    });
                }
            } catch (error) {
                console.error("An error occurred while fetching the balance:", error);
            }
        }
    }
    // Update Access List
    async function updateAccessList() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const accountAddress = await signer.getAddress();
                const contractAddress = _contractAddress;
                const abi = [
                    "function getAccessList(address) view returns (address[])",
                    "function revokeAccess(address) public"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);
    
                const accessList = await contract.getAccessList(accountAddress);
                const accessListElement = document.getElementById("accessList");
                accessListElement.innerHTML = "";
                accessList.forEach(user => {
                    const listItem = document.createElement("li");
                    listItem.textContent = user;
                    const removeButton = document.createElement("button");
                    removeButton.textContent = "Revoke Access";
                    removeButton.onclick = async () => {
                        try {
                            const revokeTx = await contract.connect(signer).revokeAccess(user);
                            await revokeTx.wait();
                            updateAccessList();
                        } catch (error) {
                            console.error("An error occurred while revoking access:", error);
                        }
                    };
                    listItem.appendChild(removeButton);
                    accessListElement.appendChild(listItem);
                });
            } catch (error) {
                console.error("An error occurred while fetching the access list:", error);
            }
        }
    }
        // Grant access
        const grantAccessButton = document.getElementById("grantAccessButton");
        if (grantAccessButton) {
            grantAccessButton.addEventListener("click", async function() {
                const userAddress = document.getElementById("accessAddress").value;
                if (typeof window.ethereum !== 'undefined' && userAddress) {
                    try {
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        const signer = provider.getSigner();
                        const contractAddress = _contractAddress; 
                        const abi = [
                            "function grantAccess(address) public",
                            "function accessList(address,address) public view returns (bool)"
                        ];
                        const contract = new ethers.Contract(contractAddress, abi, signer);
        
                        const isGranted = await contract.accessList(await signer.getAddress(), userAddress);
                        if (isGranted) {
                            alert("Access already granted to this user.");
                            return;
                        }
        
                        const tx = await contract.grantAccess(userAddress);
                        await tx.wait();
                        alert("Access granted successfully.");
                        updateAccessList();
                    } catch (error) {
                        console.error("An error occurred while granting access:", error);
                        alert(`An error occurred while granting access: ${error.message}`);
                    }
                } else {
                    alert("MetaMask is not installed or user address is not provided.");
                }
            });
        }
    // Withdraw for another user
    const withdrawForButton = document.getElementById("withdrawForButton");
    if (withdrawForButton) {
        withdrawForButton.addEventListener("click", async function() {
            const ownerAddress = document.getElementById("ownerAddress").value;
            const amount = document.getElementById("withdrawForAmount").value;
            if (typeof window.ethereum !== 'undefined' && ownerAddress && amount) {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const contractAddress = _contractAddress; 
                    const abi = [
                        "function withdrawFor(address owner, uint256 amount) public"
                    ];
                    const contract = new ethers.Contract(contractAddress, abi, signer);

                    const tx = await contract.withdrawFor(ownerAddress, ethers.utils.parseUnits(amount, 'ether'));
                    await tx.wait();
                    alert(`${amount} ETH withdrawn for ${ownerAddress} successfully`);
                    updateBalances();
                } catch (error) {
                    console.error("An error occurred while withdrawing for another user:", error);
                }
            }
        });
    }

    // Cancel Operation
    window.cancelOperation = function() {
        document.getElementById('operation-form').style.display = 'none';
    }

    // Update Balances
    async function updateBalances() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();

                const contractAddress = _contractAddress;
                const abi = [
                    "function balances(address) view returns (uint256)"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);

                const balance = await contract.balances(address);
                document.getElementById('balance-info').style.display = 'block';
                document.getElementById('current-balance').textContent = ethers.utils.formatEther(balance);
            } catch (error) {
                console.error("An error occurred while fetching the balance:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    }

    // Update Liquidity
    async function updateLiquidity() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contractAddress = _contractAddress; 
                const abi = [
                    "function totalLiquidity() view returns (uint256)"
                ];
                const contract = new ethers.Contract(contractAddress, abi, provider);

                const liquidity = await contract.totalLiquidity();
                document.getElementById('liquidity-info').style.display = 'block';
                document.getElementById('current-liquidity').textContent = ethers.utils.formatEther(liquidity);
            } catch (error) {
                console.error("An error occurred while fetching the liquidity:", error);
            }
        } else {
            console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
        }
    }
    const flipButton = document.getElementById("flipButton");
    if (flipButton) {
        flipButton.addEventListener("click", async function() {
            const amount = document.getElementById("amount").value;
            const coinDiv = document.getElementById("coin");
            const resultDiv = document.getElementById("result");

            if (typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const contractAddress = _contractAddress;
                    const abi = [
                        "function coinFlip() external payable",
                        "event CoinFlipResult(address indexed user, bool won, uint256 amount)"
                    ];
                    const contract = new ethers.Contract(contractAddress, abi, signer);

                    // Start animation
                    coinDiv.classList.add("flip");

                    console.log("Calling coinFlip function on contract...");
                    const tx = await contract.coinFlip({ value: ethers.utils.parseEther(amount) });
                    console.log("Transaction sent, waiting for confirmation...");
                    const receipt = await tx.wait();

                    console.log("Transaction confirmed:", receipt);

                    if (receipt.events) {
                        console.log("Events received:", receipt.events);
                        const event = receipt.events.find(event => event.event === "CoinFlipResult");
                        if (event) {
                            const result = event.args.won;
                            setTimeout(() => {
                                coinDiv.classList.remove("flip");
                                resultDiv.textContent = result ? "You won!" : "You lost!";
                            }, 1000);
                        } else {
                            console.error("CoinFlipResult event not found in receipt events.");
                            resultDiv.textContent = "Unable to determine the result. Please check the transaction details.";
                        }
                    } else {
                        console.error("No events found in transaction receipt.");
                        resultDiv.textContent = "No events found in transaction receipt.";
                    }
                } catch (error) {
                    console.error("An error occurred during the coin flip:", error);
                    coinDiv.classList.remove("flip");
                    resultDiv.textContent = `An error occurred: ${error.message}. Please try again.`;
                }
            } else {
                console.error('MetaMask is not installed. Please consider installing it: https://metamask.io/');
                resultDiv.textContent = "MetaMask is not installed. Please consider installing it: https://metamask.io/";
            }
        });
    } 

});