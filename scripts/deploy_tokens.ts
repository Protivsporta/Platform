import { ethers } from "hardhat";
import { utils, BigNumber } from "ethers";

async function main() {
  const initialTokenBalanceXXX: BigNumber = utils.parseUnits("10000", 18);
  const initialTokenBalanceACDM: BigNumber = utils.parseUnits("10000", 6);

  const [signer] = await ethers.getSigners();
  const ACDMToken = await ethers.getContractFactory("ACDMToken", signer);
  const acdmToken = await ACDMToken.deploy(initialTokenBalanceACDM);

  await acdmToken.deployed();

  console.log("ACDMToken contract deployed to:", acdmToken.address);

  const XXXToken = await ethers.getContractFactory("XXXToken", signer);
  const xxxToken = await XXXToken.deploy(initialTokenBalanceXXX);

  await xxxToken.deployed();

  console.log(`XXXToken contract deployed to: ${xxxToken.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});