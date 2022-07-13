const { ethers } = require("hardhat");
require('dotenv').config();


async function main() {
    const BlazeToken = await ethers.getContractFactory("BlazeToken");
    const Vesting = await ethers.getContractFactory("Vesting");

    const totalSupply = process.env.TOTAL_SUPPLY;
    const tokensToVest = (process.env.TOKEN_PERCENTAGE_TO_VEST / 100) * totalSupply;
    const tokenName = process.env.TOKEN_NAME;
    const tokenSymbol = process.env.TOKEN_SYMBOL;

    const cliffTimeInSeconds = process.env.CLIFF_TIME_IN_SECONDS;
    const vestingTimeInSeconds = process.env.VESTING_TIME_IN_SECONDS;

    const tokensForAdvisors = (process.env.VESTED_TOKENS_PERCENTAGE_FOR_ADVISORS/100) * tokensToVest;
    const tokensForPartners = (process.env.VESTED_TOKENS_PERCENTAGE_FOR_PARTNERS/100) * tokensToVest;
    const tokensForMentors = (process.env.VESTED_TOKENS_PERCENTAGE_FOR_MENTORS/100) * tokensToVest;
    
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
        ethers.utils.parseUnits(`${tokensForAdvisors}`, tokenDecimals),
        ethers.utils.parseUnits(`${tokensForPartners}`, tokenDecimals),
        ethers.utils.parseUnits(`${tokensForMentors}`, tokenDecimals),
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
