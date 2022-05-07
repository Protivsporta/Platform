import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { ACDMPlatform, ACDMToken, XXXToken, DAO, Staking, Treasure, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { utils, BigNumber } from "ethers";

const DAORole: string = "0xd0a4ad96d49edb1c33461cebc6fb2609190f32c904e3c3f5877edb4488dee91e";

describe("Platform", function() {
    let platform: ACDMPlatform;
    let lpToken: ERC20Mock;
    let acdmToken: ACDMToken;
    let xxxToken: XXXToken;
    let dao: DAO;
    let staking: Staking;
    let treasure: Treasure;
    let Bob: SignerWithAddress;
    let Alice: SignerWithAddress;
    let Mike: SignerWithAddress;
    let Tony: SignerWithAddress;

    const initialTokenBalanceXXX: BigNumber = utils.parseUnits("10000", 18);
    const initialTokenBalanceACDM: BigNumber = utils.parseUnits("10000", 6);
    const initialTokenBalanceLP: BigNumber = utils.parseUnits("10000", 18);

    const rewardPercentage: number = 3;
    const unstakeFrozenTime: number = 600; 
  
    const minimumQuorum: number = 1;
    const debatingPeriodDuration: number = 86400; // 1 day in seconds
  
    const roundTime: number = 259200; // 3 days in seconds
    const firstRefRoyaltyInSaleRound: number = 5;
    const secondRefRoyaltyInSaleRound: number = 3;
    const royaltyInTradeRound: number = 5;

    beforeEach(async function() {
        [Bob, Alice, Mike, Tony] = await ethers.getSigners();

        const ACDMToken = await ethers.getContractFactory("ACDMToken", Bob);
        acdmToken = await ACDMToken.deploy(initialTokenBalanceACDM);
        await acdmToken.deployed();

        const XXXToken = await ethers.getContractFactory("XXXToken", Bob);
        xxxToken = await XXXToken.deploy(initialTokenBalanceXXX);
        await xxxToken.deployed();

        const LPToken = await ethers.getContractFactory("ERC20Mock", Bob);
        lpToken = await LPToken.deploy("LPToken", "LP", initialTokenBalanceLP);
        await lpToken.deployed();

        const Staking = await ethers.getContractFactory("Staking", Bob);
        staking = await Staking.deploy(lpToken.address, xxxToken.address, rewardPercentage, unstakeFrozenTime);
        await staking.deployed();

        const DAO = await ethers.getContractFactory("DAO", Bob);
        dao = await DAO.deploy(minimumQuorum, debatingPeriodDuration, staking.address);
        await dao.deployed();

        const Treasure = await ethers.getContractFactory("Treasure", Bob);
        treasure = await Treasure.deploy(Mike.address, acdmToken.address);
        await treasure.deployed();

        const Platform = await ethers.getContractFactory("ACDMPlatform", Bob);
        platform = await Platform.deploy(acdmToken.address, dao.address, treasure.address, roundTime, firstRefRoyaltyInSaleRound, secondRefRoyaltyInSaleRound, royaltyInTradeRound);
        await platform.deployed();

        await staking.setDAOContractAddress(dao.address);
        await xxxToken.transfer(staking.address, initialTokenBalanceXXX);
        await acdmToken.transfer(platform.address, initialTokenBalanceACDM);

    })

    describe("Staking", function() {

        it("Should be deployed", async function() {
            expect(staking.address).to.be.properAddress;
        })
    
        describe("Stake", function() {
            
            it("Should stake 150 tokens and emit Staked event", async function() {
                await lpToken.approve(staking.address, 600);
    
                await expect(() => staking.stake(150))
                .to.changeTokenBalance(lpToken, staking, 150);
    
                await expect(staking.connect(Bob).stake(150))
                .to.emit(staking, "Staked")
                .withArgs(Bob.address, 150);
            })
    
            it("Should return error with message because account try to stake 0 or less tokens", async function() {
                await lpToken.approve(staking.address, 600);
    
                await expect(staking.stake(0))
                .to.be.revertedWith("Amount of tokens to stake should be positive");
            })
    
        })
    
        describe("Unstake", function() {
    
            it("Should unstake 150 tokens and emit Unstaked event", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                await network.provider.send("evm_increaseTime", [700000]);
                await network.provider.send("evm_mine");
    
                await expect(() => staking.connect(Bob).unstake())
                .to.changeTokenBalance(lpToken, Bob, 100000);
    
                await staking.connect(Bob).stake(100000);
    
                await network.provider.send("evm_increaseTime", [700000]);
                await network.provider.send("evm_mine");
    
                await expect(staking.connect(Bob).unstake())
                .to.emit(staking, "Unstaked")
                .withArgs(Bob.address, 100000); 
    
            })
    
            it("Should return error with message because staker try to unstake tokens too early", async function() {
                await lpToken.approve(staking.address, 600);
                await staking.connect(Bob).stake(150);
    
                await expect(staking.connect(Bob).unstake())
                .to.be.revertedWith("You can not unstake tokens now, please try later");
            })
    
            it("Should return error with message because account don't have tokens to unstake", async function() {
                await lpToken.approve(staking.address, 600);
    
                await expect(staking.connect(Bob).unstake())
                .to.be.revertedWith("You don't have tokens to unstake");
            })
        })
    
        describe("Claim", function() {
    
            it("Should claim all reward tokens and emit Claimed event", async function() {;
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                await network.provider.send("evm_increaseTime", [70000]);
                await network.provider.send("evm_mine");
    
                await expect(() => staking.connect(Bob).claim())
                .to.changeTokenBalance(xxxToken, Bob, 347);
    
                await staking.connect(Bob).stake(100000);
    
                await network.provider.send("evm_increaseTime", [70000]);
                await network.provider.send("evm_mine");
    
                await expect(staking.claim())
                .to.emit(staking, "Claimed")
                .withArgs(Bob.address, 694);
            })
    
            it("Should return error message because staker don't have rewards to claim", async function() {
                await lpToken.approve(staking.address, 600);
                await staking.connect(Bob).stake(150);
    
                await network.provider.send("evm_increaseTime", [700]);
                await network.provider.send("evm_mine");
        
                await expect(staking.connect(Bob).claim())
                .to.be.revertedWith("You don't have tokens to claim");
            })
        })
    })

    describe("DAO", function() {

        it("Should be deployed", async function() {
            expect(dao.address).to.be.properAddress;
        })
    
        describe("Vote", function() {
    
            it("Should vote 100000 tokens for proposal", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, true);
    
                expect((await dao.proposalList(0)).voteFor)
                .to.equal(100000)
            })
    
            it("Should vote 100000 tokens against proposal", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, false);
    
                expect((await dao.proposalList(0)).voteAgainst)
                .to.equal(100000)
            })
    
            it("Should revert error message because voter didn't deposit vote tokens", async function() {
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await expect(dao.vote(0, true))
                .to.be.revertedWith("For particapation you have to deposit tokens");
            })
    
            it("Should revert error message because voter tried to vote twice", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, true);
    
                await expect(dao.vote(0, false))
                .to.be.revertedWith("You can not vote twice")
            })
    
            it("Should revert error message because proposal is not added yet", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                await expect(dao.vote(0, true))
                .to.be.revertedWith("Proposal is not on debating fase now")
            })
    
            it("Should revert error message because proposal has already been debated", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await network.provider.send("evm_increaseTime", [100000]);
                await network.provider.send("evm_mine");
    
                await expect(dao.vote(0, true))
                .to.be.revertedWith("Proposal has already been debated")
            })
        })
    
        describe("AddProposal", function() {
    
            it("Should add proposal and emmit ProposalAdded event", async function() {
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                expect((await dao.proposalList(0)).recipient)
                .to.be.equal("0x96D67D409741023BB152918F0F951249a7DD6626")
    
                await expect(dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626"))
                .to.emit(dao, "ProposalAdded")
                .withArgs(1, "0x96D67D409741023BB152918F0F951249a7DD6626")
            })
    
            it("Should revert error message because sender not chairPerson", async function() {
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await expect(dao.connect(Alice).addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626"))
                .to.be.revertedWith("You are not allowed to add proposal")
            })
        }) 
    
        describe("Finish", function() {
    
            it("Should finish proposal debating and emit ProposalAccepted event", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, true);
    
                await network.provider.send("evm_increaseTime", [100000]);
                await network.provider.send("evm_mine");
    
                await expect(dao.finishProposal(0))
                .to.emit(dao, "ProposalAccepted")
                .withArgs(0, "0x96D67D409741023BB152918F0F951249a7DD6626")
            })
    
            it("Should finish proposal debating and emit ProposalDenied event", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, false);
    
                await network.provider.send("evm_increaseTime", [100000]);
                await network.provider.send("evm_mine");
    
                await expect(dao.finishProposal(0))
                .to.emit(dao, "ProposalDenied")
                .withArgs(0, "0x96D67D409741023BB152918F0F951249a7DD6626")
            })
    
            it("Should decrease number of active proposals for sender", async function() {
                await lpToken.approve(staking.address, 300000);
                await staking.connect(Bob).stake(100000);
    
                const data: Uint8Array = new Uint8Array(); // generates empty Uint8Array
    
                await dao.addProposal(data, "0x96D67D409741023BB152918F0F951249a7DD6626");
    
                await dao.vote(0, true);
    
                await network.provider.send("evm_increaseTime", [100000]);
                await network.provider.send("evm_mine");
    
                await dao.finishProposal(0);
    
                expect((await dao.votersList(Bob.address)))
                .to.be.equal(0)
            })
        })
    })

    describe("Platform", function() {

        it("Should be deployed", async function() {
            expect(platform.address).to.be.properAddress;
        })

        describe("Register", function() {

            it("Should register account to the platform", async function() {
                await platform.connect(Alice).register(Bob.address);

                expect((await platform.referals(Alice.address)))
                .to.be.equal(Bob.address);
            })

            it("Should revert error message because account is already registered", async function() {
                await expect(platform.register(Bob.address))
                .to.be.revertedWith("You are already registered on the platform")
            })

            it("Should revert error message because referral is not registered yet", async function() {
                await expect(platform.connect(Alice).register(Mike.address))
                .to.be.revertedWith("Referal should be already registered on the platform")
            })
        })

        describe("Round status toggler", function() {

            it("Should change round status to Sale", async function() {
                await platform.startSaleRound();

                expect((await platform.round()))
                .to.be.equal(1)
            })

            it("Should revert error message because round status is already Sale", async function() {
                await platform.startSaleRound();

                await expect(platform.startSaleRound())
                .to.be.revertedWith("Current round is not for trade")
            })

            it("Should revert error message because Bob try to start sale round too early", async function() {
                await platform.startSaleRound();

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await expect(platform.startSaleRound())
                .to.be.revertedWith("Trade round is not finished yet")
            })

            it("Should change round status to Trade", async function() {
                await platform.startSaleRound();

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                expect((await platform.round()))
                .to.be.equal(0)
            })

            it("Should revert error message because round status is already Trade", async function() {
                await expect(platform.startTradeRound())
                .to.be.revertedWith("Current round is not for sale")
            })

            it("Should revert error message because Bob try to start trade round too early", async function() {
                await platform.startSaleRound();

                await expect(platform.startTradeRound())
                .to.be.revertedWith("Sale round is not finished yet")
            })
        })

        describe("BuyACDM", function() {

            it("Should transfer ETH to the contract and transfer tokens from contract to Bob", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("1.0");
                await platform.startSaleRound();

                await expect(await platform.connect(Alice).buyACDM({ value: 1000 }))
                .to.changeEtherBalance(platform, 1000)

                await expect(() => platform.buyACDM({ value: amountOfTransfer }))
                .to.changeTokenBalance(acdmToken, Bob, 100000)
            })

            it("Should revert error message because of soldout in this round", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("1.0");
                await platform.startSaleRound();

                platform.buyACDM({ value: amountOfTransfer });

                await expect(platform.buyACDM({ value: amountOfTransfer }))
                .to.be.revertedWith("Unsufficient token balance on contract")
            })

            it("Should transfer royalty to the first ref", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                const firstRefRoyalty: BigNumber = utils.parseEther("0.005");
                await platform.startSaleRound();

                await platform.connect(Alice).register(Bob.address);
                await platform.connect(Mike).register(Alice.address);

                await expect(() => platform.connect(Mike).buyACDM({ value: amountOfTransfer }))
                .to.changeEtherBalance(Alice, firstRefRoyalty)

            })

            it("Should transfer royalty to the second ref", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                const secondRefRoyalty: BigNumber = utils.parseEther("0.003");
                await platform.startSaleRound();

                await platform.connect(Alice).register(Bob.address);
                await platform.connect(Mike).register(Alice.address);

                await expect(() => platform.connect(Mike).buyACDM({ value: amountOfTransfer }))
                .to.changeEtherBalance(Bob, secondRefRoyalty)
            })
        })

        describe("Add order", function() {

            it("Should add order and transfer acdm tokens to the contract", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await platform.buyACDM({ value: amountOfTransfer });

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await expect(() => platform.addOrder(300, 1))
                .to.changeTokenBalance(acdmToken, platform, 300)
            })

            it("Should revert error message because of unsufficient balance", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await expect(platform.addOrder(300, 1))
                .to.be.revertedWith("You don't have required amount of tokens")
            })
        })

        describe("Remove order", function() {

            it("Should remove order and transfer tokens back to the owner", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await platform.buyACDM({ value: amountOfTransfer });

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await platform.addOrder(300, 1);

                await expect(() => platform.removeOrder(0))
                .to.changeTokenBalance(acdmToken, Bob, 300)
            })

            it("Should revert with error message because account is not owner of an order", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await platform.buyACDM({ value: amountOfTransfer });

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await platform.addOrder(300, 1);

                await expect(platform.connect(Alice).removeOrder(0))
                .to.be.revertedWith("Only owner can remove order")
            })
        })
        
        describe("Fill order", function() {

            it("Should revert with error message because of order id no existance", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await platform.buyACDM({ value: amountOfTransfer });

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await platform.addOrder(300, 1);

                await expect(platform.fillOrder(2))
                .to.be.revertedWith("This order does not exist")
            })

            it("Should transfer 50 tokens to Alice account", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("0.1");
                await platform.startSaleRound();
                await acdmToken.approve(platform.address, 100000);

                await platform.buyACDM({ value: amountOfTransfer });

                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");

                await platform.startTradeRound();

                await platform.addOrder(100, 1);

                await expect(() => platform.connect(Alice).fillOrder(0, { value: 50 }))
                .to.changeTokenBalance(acdmToken, Alice, 50)
            })
        })
    })

    describe("Treasure", function() {
         it("Should revert with error message because of Bob missing DAO role", async function() {
            const amountOfTransfer: BigNumber = utils.parseEther("1");
            await platform.startSaleRound();
            await acdmToken.approve(platform.address, 100000);

            await platform.buyACDM({ value: amountOfTransfer });

            await network.provider.send("evm_increaseTime", [1000000]);
            await network.provider.send("evm_mine");

            await platform.startTradeRound();

            await platform.addOrder(10000, 1);

            await platform.connect(Alice).fillOrder(0, { value: 5000 })

            await expect(treasure.sendToOwner())
            .to.be.revertedWith("account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0xd0a4ad96d49edb1c33461cebc6fb2609190f32c904e3c3f5877edb4488dee91e")
         })

         it("Should send all eth from contract to the owner", async function() {
            const amountOfTransfer: BigNumber = utils.parseEther("1");
            await platform.startSaleRound();
            await acdmToken.connect(Alice).approve(platform.address, 100000);

            await platform.connect(Alice).buyACDM({ value: amountOfTransfer });

            await network.provider.send("evm_increaseTime", [1000000]);
            await network.provider.send("evm_mine");

            await platform.startTradeRound();

            await platform.connect(Alice).addOrder(10000, 1);

            await platform.fillOrder(0, { value: 5000 })

            await expect(() => treasure.connect(Mike).sendToOwner())
            .to.changeEtherBalance(Bob, 250)
         })

         it("Should revert with error message because of no ETH on treasure contract", async function() {
                const amountOfTransfer: BigNumber = utils.parseEther("1");
                await platform.startSaleRound();
                await acdmToken.connect(Alice).approve(platform.address, 100000);
    
                await platform.connect(Alice).buyACDM({ value: amountOfTransfer });
    
                await network.provider.send("evm_increaseTime", [1000000]);
                await network.provider.send("evm_mine");
    
                await platform.startTradeRound();
    
                await platform.connect(Alice).addOrder(10000, 1);
        
                await expect(treasure.connect(Mike).sendToOwner())
                .to.be.revertedWith("There is no ETH to send")
         })

         it("Should revert error message because of missing DAO role", async function() {
            const amountOfTransfer: BigNumber = utils.parseEther("1");
            await platform.startSaleRound();
            await acdmToken.connect(Alice).approve(platform.address, 100000);

            await platform.connect(Alice).buyACDM({ value: amountOfTransfer });

            await network.provider.send("evm_increaseTime", [1000000]);
            await network.provider.send("evm_mine");

            await platform.startTradeRound();

            await platform.connect(Alice).addOrder(10000, 1);

            await platform.fillOrder(0, { value: 5000 })

            await expect(treasure.connect(Alice).swapETHToACDMTokensANDBurn(20, 20000))
            .to.be.revertedWith("account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xd0a4ad96d49edb1c33461cebc6fb2609190f32c904e3c3f5877edb4488dee91e")
         })

         it("Should revert error message because of no ETH on the contract", async function() {
            const amountOfTransfer: BigNumber = utils.parseEther("1");
            await platform.startSaleRound();
            await acdmToken.connect(Alice).approve(platform.address, 100000);

            await platform.connect(Alice).buyACDM({ value: amountOfTransfer });

            await network.provider.send("evm_increaseTime", [1000000]);
            await network.provider.send("evm_mine");

            await platform.startTradeRound();

            await platform.connect(Alice).addOrder(10000, 1);
    
            await expect(treasure.connect(Mike).swapETHToACDMTokensANDBurn(20, 20000))
            .to.be.revertedWith("There is no ETH to swap")
         })
         
    })
})