import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("startsaleround", "Starts sale round, where you can buy tokens from platform")
  .setAction(async (hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.startSaleRound();
    console.log(`Sale round has been started!`);
  });