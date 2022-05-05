import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("starttraderound", "Starts trade round, where you can buy tokens from platform participants")
  .setAction(async (hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.startTradeRound();
    console.log(`Trade round has been started!`);
  });