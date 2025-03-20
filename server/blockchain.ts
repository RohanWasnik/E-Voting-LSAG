import Web3 from 'web3';
import type { Vote } from '@shared/schema';

let web3: Web3 | null = null;

const initWeb3 = async () => {
  if (web3) return web3;

  try {
    web3 = new Web3('http://localhost:8545');
    await web3.eth.net.isListening();
    return web3;
  } catch (error) {
    throw new Error('Failed to connect to blockchain');
  }
};

export async function storeVoteOnChain(vote: Vote): Promise<string> {
  try {
    const web3Instance = await initWeb3();
    const accounts = await web3Instance.eth.getAccounts();

    if (!accounts || accounts.length === 0) {
      throw new Error('No blockchain accounts available');
    }

    // Convert vote data to hex string
    const voteData = JSON.stringify({
      electionId: vote.electionId,
      voteHash: vote.voteHash,
      lsagSignature: vote.lsagSignature
    });
    const hexData = web3Instance.utils.utf8ToHex(voteData);

    const tx = await web3Instance.eth.sendTransaction({
      from: accounts[0],
      to: '0x0000000000000000000000000000000000000000',
      data: hexData,
      gas: 2000000
    });

    return tx.transactionHash;
  } catch (error) {
    console.error('Failed to store vote on blockchain:', error);
    throw new Error('Failed to store vote on blockchain');
  }
}

export async function verifyVote(txHash: string): Promise<boolean> {
  try {
    const web3Instance = await initWeb3();
    const tx = await web3Instance.eth.getTransaction(txHash);
    const receipt = await web3Instance.eth.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return false;
    }

    return receipt.status;
  } catch (error) {
    console.error('Failed to verify vote:', error);
    return false;
  }
}