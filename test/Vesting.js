const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vesting", () => {
    let owner;
    let beneficiary1;
    let beneficiary2;
    let beneficiary3;

    let BlazeToken;
    let blazeToken;
    let Vesting;
    let vesting;
    let tokenDecimals;

    const totalSupply = 5 * 10**9;
    const tokensToVest = (30/100) * totalSupply;
    const tokenName = "BlazeToken";
    const tokenSymbol = "BLZ";
    const cliffTimeInSeconds = 1000;
    const vestingTimeInSeconds = 10000;
    const tokensForAdvisors = (35/100) * tokensToVest;
    const tokensForMentors = (15/100) * tokensToVest;
    const tokensForPartners = (50/100) * tokensToVest;
    

    beforeEach(async () => {
        [owner, beneficiary1, beneficiary2, beneficiary3] = await ethers.getSigners();
        BlazeToken = await ethers.getContractFactory("BlazeToken");
        Vesting = await ethers.getContractFactory("Vesting");

        // Deploy ERC20 token.
        blazeToken = await BlazeToken.deploy(
            totalSupply,
            tokenName,
            tokenSymbol
        );
        await blazeToken.deployed();
        tokenDecimals = await blazeToken.decimals();
    
        // Deploy vesting contract.
        vesting = await Vesting.deploy(
            blazeToken.address,
            cliffTimeInSeconds,
            vestingTimeInSeconds,
            ethers.utils.parseUnits(`${tokensForAdvisors}`, tokenDecimals),
            ethers.utils.parseUnits(`${tokensForPartners}`, tokenDecimals),
            ethers.utils.parseUnits(`${tokensForMentors}`, tokenDecimals),
        );
        await vesting.deployed();

        // Send tokens to Vesting contract.
        const txn = await blazeToken.transfer(
            vesting.address,
            ethers.utils.parseUnits(`${tokensToVest}`,tokenDecimals)
        );
        await txn.wait();
    });
    
    it("Vesting contract has sufficient tokens", async () => {
        const vestingContractTokens = await blazeToken.balanceOf(vesting.address);
        expect(vestingContractTokens).to.equal(ethers.utils.parseUnits(`${tokensToVest}`, tokenDecimals));
    });

    it("Owner has the remaining tokens", async () => {
        const ownerBalance = await blazeToken.balanceOf(owner.address);
        const remainingTokens = totalSupply - tokensToVest;
        expect(ownerBalance).to.equal(ethers.utils.parseUnits(`${remainingTokens}`, tokenDecimals));
    });

    it("Can add partners", async () => {
        await vesting.addPartner(beneficiary1.address);
        await vesting.addPartner(beneficiary2.address);
        await vesting.addPartner(beneficiary3.address);
        expect(await vesting.totalPartners()).to.equal(3);
    });

    it("Can add advisors", async () => {
        await vesting.addAdvisor(beneficiary1.address);
        await vesting.addAdvisor(beneficiary2.address);
        expect(await vesting.totalAdvisors()).to.equal(2);
    });

    it("Can add mentors", async () => {
        await vesting.addMentor(owner.address);
        await vesting.addMentor(beneficiary1.address);
        await vesting.addMentor(beneficiary2.address);
        await vesting.addMentor(beneficiary3.address);
        expect(await vesting.totalMentors()).to.equal(4);
    });

    it("Can remove beneficiary", async () => {
        await vesting.addPartner(beneficiary1.address);
        await vesting.addPartner(beneficiary2.address);
        expect(await vesting.totalPartners()).to.equal(2);
        await vesting.removeBeneficiary(beneficiary2.address);
        expect(await vesting.totalPartners()).to.equal(1);
    });

    it("Cannot add duplicate beneficiary", async () => {
        await vesting.addPartner(beneficiary1.address);
        await vesting.addPartner(beneficiary2.address);
        expect(await vesting.totalPartners()).to.equal(2);
        expect(
            vesting.addPartner(beneficiary2.address)
        ).to.be.revertedWith("Given address is already a beneficiary!");
        expect(
            vesting.addMentor(beneficiary2.address)
        ).to.be.revertedWith("Given address is already a beneficiary!");
        expect(
            vesting.addAdvisor(beneficiary2.address)
        ).to.be.revertedWith("Given address is already a beneficiary!");
    });

    it("Cannot add null address as a beneficiary", async () => {
        expect(
            vesting.addPartner("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("Null address cannot be a beneficiary!");
    });

});
