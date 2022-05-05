import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("register", "Register account and his ref to referal program")
  .addParam("ref", "Referal address")
  .setAction(async (taskArgs, hre) => {
    const ACDMPlatform = await hre.ethers.getContractAt("ACDMPlatform", process.env.PLATFORM_CONTRACT_ADDR!);
    await ACDMPlatform.register(taskArgs.ref);
    console.log(`${hre.ethers.Signer} referal is - ${taskArgs.ref}!`);
  });