import { ethers } from "hardhat";

async function main() {

  const rewardPercentage: number = 3;
  const unstakeFrozenTime: number = 86400; // 1 day in seconds

  const minimumQuorum: number = 3;
  const debatingPeriodDuration: number = 86400; // 1 day in seconds

  const roundTime: number = 259200; // 3 days in seconds

  const [signer] = await ethers.getSigners();
  const Staking = await ethers.getContractFactory("Staking", signer);
  const staking = await Staking.deploy("0x8ED007FfdBF8855c7407E03B89E812073c1A4ce7", "0xf1994bac419e58081b84aD4bF1F049DbE6dB86fD", rewardPercentage, unstakeFrozenTime);

  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);

  const DAO = await ethers.getContractFactory("DAO", signer);
  const dao = await DAO.deploy(minimumQuorum, debatingPeriodDuration, staking.address);

  await dao.deployed();

  console.log(`DAO contract deployed to: ${dao.address}`);

  const Treasure = await ethers.getContractFactory("Treasure", signer);
  const treasure = await Treasure.deploy(dao.address, "0xb03C87024EF3249A7A22c7d6E1825b11C240fDBb");

  await treasure.deployed();

  console.log(`Tresure contract deployed to: ${treasure.address}`);

  const Platform = await ethers.getContractFactory("ACDMPlatform", signer);
  const platform = await Platform.deploy("0xb03C87024EF3249A7A22c7d6E1825b11C240fDBb", dao.address, treasure.address, roundTime);

  await platform.deployed();

  console.log(`Platform contract deployed to: ${platform.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});