// SPDX-License-Identifier: MIT
pragma solidity >=0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vesting is Ownable {

    enum Roles { Advisor, Partner, Mentor }
    Roles private role;

    struct Beneficiary {
        bool isBeneficiary;
        uint256 totalTokensClaimed;
        uint256 lastTimeTokensClaimed;
        Roles role;
    }

    mapping(address => Beneficiary) private beneficiaries;
    mapping(Roles => uint256) private totalBeneficiariesWithRole;
    mapping(Roles => uint256) private totalTokensForRole;

    event AddBeneficiary(
        address indexed _addr,
        Roles indexed _role,
        uint256 _time
    );

    event RemoveBeneficiary(
        address indexed _addr,
        Roles indexed _role,
        uint256 _time
    );

    // uint256 private immutable cliffPeriod;
    // uint256 private immutable vestingPeriod;
    uint256 public vestingStartedAtTime;
    bool private hasVestingStarted;

    function addMentor(address _addr) external onlyOwner {
        addBeneficiary(_addr, Roles.Mentor);
    }

    function addAdvisor(address _addr) external onlyOwner {
        addBeneficiary(_addr, Roles.Advisor);
    }

    function addPartner(address _addr) external onlyOwner {
        addBeneficiary(_addr, Roles.Partner);
    }

    function removeBeneficiary(address _addr) external onlyOwner {
        require(
            beneficiaries[_addr].isBeneficiary,
            "Not a beneficiary!"
        );
        beneficiaries[_addr].isBeneficiary = false;
        totalBeneficiariesWithRole[beneficiaries[_addr].role] -= 1;

        emit RemoveBeneficiary(_addr, beneficiaries[_addr].role, block.timestamp);
    }

    function addBeneficiary(address _addr, Roles _role) private {
        require(
            beneficiaries[_addr].isBeneficiary != true,
            "Given address is already a beneficiary!"
        );
        require(
            _addr != address(0),
            "Null address cannot be a beneficiary!"
        );
        require(
            !hasVestingStarted,
            "Vesting has started! Cannot add a beneficiary now!"
        );

        beneficiaries[_addr].isBeneficiary = true;
        beneficiaries[_addr].role = _role;
        totalBeneficiariesWithRole[_role] += 1;

        emit AddBeneficiary(_addr, _role, block.timestamp);
    }

}
