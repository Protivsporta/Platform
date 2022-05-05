import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { ACDMPlatform, ACDMToken, XXXToken, DAO, Staking, Treasure } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const DAORole: string = "0xd0a4ad96d49edb1c33461cebc6fb2609190f32c904e3c3f5877edb4488dee91e";