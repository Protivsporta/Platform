import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("removeorder", "Remove order from p2p sale of platform")
  .addParam("orderid", "Id of order that should be removed")
  .setAction(async (taskArgs, hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.removeOrder(taskArgs.orderid);
    console.log(`Order with ${taskArgs.orderid} id was removed!`);
  });