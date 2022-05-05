import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("addorder", "Add order to p2p sale of platform")
  .addParam("amount", "Amount of tokens to sale")
  .addParam("priceineth", "Token price in ETH eq")
  .setAction(async (taskArgs, hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.addOrder(taskArgs.amount, taskArgs.priceineth);
    console.log(`Order with ${taskArgs.amount} tokens was placed, price is ${taskArgs.priceineth}!`);
  });