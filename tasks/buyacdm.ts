import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("buyacdm", "Buy ACDM tokens in Sale round")
  .addParam("amount", "Amount of ETH to swap for ACDM tokens")
  .setAction(async (taskArgs, hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.buyACDM({ value: hre.ethers.utils.parseEther(taskArgs.amount) });
    console.log(`${taskArgs.amount} was swaped to ACDM tokens!`);
  });