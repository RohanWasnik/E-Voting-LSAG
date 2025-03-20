import Web3 from 'web3';

let web3Instance: Web3 | null = null;

export const initWeb3 = async () => {
  if (web3Instance) return web3Instance;

  try {
    // Connect to Ganache
    web3Instance = new Web3('http://localhost:8545');

    // Verify connection
    await web3Instance.eth.net.isListening();

    return web3Instance;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    throw new Error('Failed to connect to blockchain. Please ensure Ganache is running.');
  }
};

export const storeOnBlockchain = async (data: any) => {
  try {
    const web3 = await initWeb3();
    const accounts = await web3.eth.getAccounts();

    if (!accounts || accounts.length === 0) {
      throw new Error('No blockchain accounts available');
    }

    // Convert data to hex string
    const dataString = JSON.stringify(data);
    const hexData = web3.utils.utf8ToHex(dataString);

    const tx = await web3.eth.sendTransaction({
      from: accounts[0],
      to: '0x0000000000000000000000000000000000000000',
      data: hexData,
      gas: 2000000
    });

    return tx.transactionHash;
  } catch (error) {
    console.error('Failed to store data on blockchain:', error);
    throw new Error('Failed to store vote on blockchain');
  }
};

export const verifyTransaction = async (txHash: string) => {
  try {
    const web3 = await initWeb3();
    const tx = await web3.eth.getTransaction(txHash);
    const receipt = await web3.eth.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return false;
    }

    // Check both transaction existence and success
    return receipt.status;
  } catch (error) {
    console.error('Failed to verify transaction:', error);
    return false;
  }
};