const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlazeToken", () => {
    const tokenName = "BlazeToken";
    const tokenSymbol = "BLZ";
    const tokenSupply = 10000;

    let owner;
    let BlazeToken;
    let blazeToken;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();
        BlazeToken = await ethers.getContractFactory("BlazeToken");
        blazeToken = await BlazeToken.deploy(
            tokenSupply,
            tokenName,
            tokenSymbol
        );
        await blazeToken.deployed();
    });

    it("Sets correct name and symbol", async () => {
        
        expect(await blazeToken.name()).to.equal(tokenName);
        expect(await blazeToken.symbol()).to.equal(tokenSymbol);
    });

    it("Sets correct initial supply", async () => {
        const totalSupply = await blazeToken.totalSupply();
        expect(totalSupply/10**18).to.equal(tokenSupply);
    });

    it("Mints all tokens to owner", async () => {
        const ownerBalance = await blazeToken.balanceOf(owner.address);
        const totalSupply = await blazeToken.totalSupply();
        expect(ownerBalance).to.equal(totalSupply);
    });
});
