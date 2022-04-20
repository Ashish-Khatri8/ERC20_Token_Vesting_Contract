const { ethers } = require("hardhat");

async function main() {
    const BlazeToken = await ethers.getContractFactory("BlazeToken");
    const Vesting = await ethers.getContractFactory("Vesting");

     // Token Supply of 5 billion tokens.
    const totalSupply = 5 * 10**9;
    // Vest 30% tokens => 1.5 billion tokens.
    const tokensToVest = (30 / 100) * totalSupply;
    const tokenName = "BlazeToken";
    const tokenSymbol = "BLZ";

    const cliffTimeInSeconds = 1000;
    const vestingTimeInSeconds = 10000;

    const tokensForAdvisors = (35/100) * tokensToVest;
    const tokensForPartners = (50/100) * tokensToVest;
    const tokensForMentors = (15/100) * tokensToVest;
    
    // Deploy ERC20 token.
    const blazeToken = await BlazeToken.deploy(
        totalSupply,
        tokenName,
        tokenSymbol
    );
    await blazeToken.deployed();
    console.log("BlazeToken deployed at: ", blazeToken.address);

    const tokenDecimals = await blazeToken.decimals();
    
    // Deploy vesting contract.
    const vesting = await Vesting.deploy(
        blazeToken.address,
        cliffTimeInSeconds,
        vestingTimeInSeconds,
        ethers.utils.parseUnits(`${tokensForAdvisors}`, tokenDecimals),//tokensForAdvisors * 10**tokenDecimals,
        ethers.utils.parseUnits(`${tokensForPartners}`, tokenDecimals),//tokensForPartners* 10**tokenDecimals,
        ethers.utils.parseUnits(`${tokensForMentors}`, tokenDecimals),//tokensForMentors* 10**tokenDecimals
    );
    await vesting.deployed();
    console.log("Vesting contract deployed at: ", vesting.address);

    // Send tokens to Vesting contract.
    const txn = await blazeToken.transfer(vesting.address, ethers.utils.parseUnits(`${tokensToVest}`, tokenDecimals));
    await txn.wait();
    
    const owner = await blazeToken.owner();
    console.log("Owner address: ", owner);
    console.log("Token balance of owner: ", await blazeToken.balanceOf(owner));
    console.log("Token balance of vesting contract: ", await blazeToken.balanceOf(vesting.address));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    });
