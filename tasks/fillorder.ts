import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("fillorder", "Buy ACDM tokens on trade round by order id")
  .addParam("orderid", "Id of order to fill")
  .addParam("amount", "Amount of ETH to send to fill")
  .setAction(async (taskArgs, hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.fillOrder(taskArgs.orderid, { value: hre.ethers.utils.parseEther(taskArgs.amount) });
    console.log(`${taskArgs.amount} eth was swaped to ACDM tokens on ${taskArgs.orderid} order!`);
  });