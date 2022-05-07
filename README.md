# Token platform contract

This is token platform with functionality to sale tokens, to P2P trade after sale round, to stake your tokens, to vote by DAO mechanism, also included treasure contract for fee accumulation and token price control.

All contracts deployed to Ethereum Rinkeby test network

Platform contract: 0xd0cb5041D5Bc068A50034636CbB44683CdD03B1c

Staking contract: 0x8E833511fA8778C67958420B60012fB441278CE2

DAO contract: 0x587e7bc2Edef7eA63E0593fa17241F74a8d1d370

Treasure contract: 0xedcC7A88916D9b4d24d4b75002728b14F853B43e

Tasks list:

```shell
  addorder                      Add order to p2p sale of platform
  buyacdm                       Buy ACDM tokens in Sale round
  check                         Check whatever you need
  clean                         Clears the cache and deletes all artifacts
  compile                       Compiles the entire project, building all artifacts
  console                       Opens a hardhat console
  coverage                      Generates a code coverage report for tests
  fillorder                     Buy ACDM tokens on trade round by order id
  flatten                       Flattens and prints contracts and their dependencies
  help                          Prints this message
  node                          Starts a JSON-RPC server on top of Hardhat Network
  register                      Register account and his ref to referal program
  removeorder                   Remove order from p2p sale of platform
  run                           Runs a user-defined script after compiling the project
  sendeth_to_owner              Send all Treasure contract ETH to owner
  startsaleround                Starts sale round, where you can buy tokens from platform
  starttraderound               Starts trade round, where you can buy tokens from platform participants
  swapeth_to_acdm_and_burn      Buy ACDM tokens from uniswap and burn them
  test                          Runs mocha tests
  typechain                     Generate Typechain typings for compiled contracts
  verify                        Verifies contract on Etherscan
```

# Etherscan verification

All contracts verified on etherscan
