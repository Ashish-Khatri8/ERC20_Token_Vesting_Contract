# ERC20 Vesting Contract

## Contract: BlazeToken.sol

This contract deploys an ERC20 token with the following details.

- Name: "BlazeK"
- Symbol: "BLZ"
- Decimals: 18
- Total Supply: 5 billion => 5 * 10**9 => 5000000000

- Contract deployed on [rinkeby test network](https://rinkeby.etherscan.io/address/0x8a52C79792391522F8A0994B0BD3D4adA5d10188) at:

> 0x8a52C79792391522F8A0994B0BD3D4adA5d10188

30% of total supply => 1.5 billion tokens are sent to the vesting contract in order to be vested for Advisors, Mentors and Partners.

## Contract: Vesting.sol

This contract vests the tokens received for a linear vesting schedule with a cliff period for different roles.

- Contract deployed on [rinkeby test network](https://rinkeby.etherscan.io/address/0x1aF0cC4cAB2747f1BCf6EFacF15f59fcFf556138) at:

>0x1aF0cC4cAB2747f1BCf6EFacF15f59fcFf556138

- Roles: Partner, Advisor, Mentor

### Tokens vested for different roles:-

- Partners: 50% of vested tokens => 0.75 billion tokens
- Advisors: 35% of vested tokens => 0.525 billion tokens
- Mentors: 15% of vested tokens => 0.225 billion tokens

There is a cliff period of 1 month after vesting starts during which no tokens will be vested and released.

After that, tokens for each beneficiary will vest and be available to claim in a linear vesting schedule for the next 12 months.

The owner of the contract can remove a beneficiary after vesting starts and all the unclaimed tokens of that beneficiary would be sent back to the owner.

### Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case.

```shell
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
