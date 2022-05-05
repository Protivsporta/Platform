import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("sendeth_to_owner", "Send all Treasure contract ETH to owner")
  .setAction(async (taskArgs, hre) => {
    const Treasure = await hre.ethers.getContractAt("Treasure", process.env.Treasure_CONTRACT_ADDR!);
    await Treasure.sendToOwner();
    console.log(`All amount of eth on the Treasure contract was sent to owner`);
  });