import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("swapeth_to_acdm_and_burn", "Buy ACDM tokens from uniswap and burn them")
  .addParam("amountoutmin", "Min amount of ACDM tokens from swap")
  .addParam("deadline", "Deadline for swap transaction")
  .setAction(async (taskArgs, hre) => {
    const Treasure = await hre.ethers.getContractAt("Treasure", process.env.Treasure_CONTRACT_ADDR!);
    await Treasure.swapETHToACDMTokensANDBurn(taskArgs.amountoutmin, taskArgs.deadline);
    console.log(`All amount of eth on the Treasure contract was swapped to ACDM tokens and burned!`);
  });