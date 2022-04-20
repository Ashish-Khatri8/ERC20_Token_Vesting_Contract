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
        Roles role;
    }

    mapping(address => Beneficiary) private beneficiaries;
    mapping(Roles => uint256) private totalBeneficiariesWithRole;
    mapping(Roles => uint256) private totalTokensForRole;
    mapping(Roles => uint256) private tokensPerBeneficiaryOfRole;

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

    event IERC20_Claimed(
        address indexed by,
        uint256 indexed value
    );

    event VestingStarted(uint256 indexed time);

    IERC20 private token;
    uint256 private immutable cliffPeriod;
    uint256 private immutable vestingPeriod;
    uint256 public vestingStartTime;
    bool private hasVestingStarted;

    constructor(
        IERC20 _token,
        uint256 _cliffTime,
        uint256 _vestingTime,
        uint256 _tokensForAdvisors,
        uint256 _tokensForPartners,
        uint256 _tokensForMentors
    ) {
        token = _token;
        cliffPeriod = _cliffTime;
        vestingPeriod = _vestingTime;

        totalTokensForRole[Roles.Advisor] = _tokensForAdvisors;
        totalTokensForRole[Roles.Partner] = _tokensForPartners;
        totalTokensForRole[Roles.Mentor] = _tokensForMentors;
    }

    function startVesting() external onlyOwner {
        require(
            !hasVestingStarted,
            "Vesting has already started!"
        );
        hasVestingStarted = true;
        uint256 time = block.timestamp;
        vestingStartTime = time;

        calculatePerBeneficiaryTokens();
        emit VestingStarted(time);
    }

    function claimTokens() external {
        checkVestingPhase();
        require(
            beneficiaries[msg.sender].isBeneficiary,
            "You are not a beneficiary!"
        );
        require(
            beneficiaries[msg.sender].totalTokensClaimed < 
            tokensPerBeneficiaryOfRole[beneficiaries[msg.sender].role],
            "You have claimed all the vested tokens!"
        );

        uint256 tokensToClaim = getAvailableTokens(msg.sender);
        token.transfer(msg.sender, tokensToClaim);
        beneficiaries[msg.sender].totalTokensClaimed += tokensToClaim;

        emit IERC20_Claimed(msg.sender, tokensToClaim);
    }

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
            "You are not a beneficiary!"
        );
        Roles beneficiaryRole = beneficiaries[_addr].role;

        beneficiaries[_addr].isBeneficiary = false;
        totalBeneficiariesWithRole[beneficiaryRole] -= 1;

        emit RemoveBeneficiary(_addr, beneficiaryRole, block.timestamp);

        // If vesting has started, send unclaimed tokens back to owner.
        if (hasVestingStarted) {
            uint256 claimedTokens = beneficiaries[_addr].totalTokensClaimed;
            uint256 unclaimedTokens =  tokensPerBeneficiaryOfRole[beneficiaryRole] - claimedTokens;
            if (unclaimedTokens > 0) {
                token.transfer(owner(), unclaimedTokens);
                emit IERC20_Claimed(owner(), unclaimedTokens);
            }
        }
    }

    function contractTokenBalance() external view onlyOwner returns(uint256) {
        return token.balanceOf(address(this));
    }

    function tokensClaimedBy(address _addr) external view onlyOwner returns(uint256) {
        return beneficiaries[_addr].totalTokensClaimed;
    }

    function perAdvisorTokens() external view onlyOwner returns(uint256) {
        return tokensPerBeneficiaryOfRole[Roles.Advisor];
    }

    function perMentorTokens() external view onlyOwner returns(uint256) {
        return tokensPerBeneficiaryOfRole[Roles.Mentor];
    }

    function perPartnerTokens() external view onlyOwner returns(uint256) {
        return tokensPerBeneficiaryOfRole[Roles.Partner];
    }

    function totalAdvisors() external view onlyOwner returns(uint256) {
        return totalBeneficiariesWithRole[Roles.Advisor];
    }

    function totalMentors() external view onlyOwner returns(uint256) {
        return totalBeneficiariesWithRole[Roles.Mentor];
    }

    function totalPartners() external view onlyOwner returns(uint256) {
        return totalBeneficiariesWithRole[Roles.Partner];
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

    function calculatePerBeneficiaryTokens() private {
        uint256 _totalAdvisors = totalBeneficiariesWithRole[Roles.Advisor];
        uint256 _totalMentors = totalBeneficiariesWithRole[Roles.Mentor];
        uint256 _totalPartners = totalBeneficiariesWithRole[Roles.Partner];

        if (_totalAdvisors > 0)
            tokensPerBeneficiaryOfRole[Roles.Advisor] = totalTokensForRole[Roles.Advisor] / _totalAdvisors;
        
        if (_totalMentors > 0)
            tokensPerBeneficiaryOfRole[Roles.Mentor] = totalTokensForRole[Roles.Mentor] / _totalMentors;

        if (_totalPartners > 0)
            tokensPerBeneficiaryOfRole[Roles.Partner] = totalTokensForRole[Roles.Partner] / _totalPartners;
    }

    function checkVestingPhase() private view {
        require(
            hasVestingStarted,
            "Vesting has not started yet!"
        );
        require(
            block.timestamp - vestingStartTime > cliffPeriod,
            "Vesting is in cliff period! No tokens would be released."
        );
    }

    function getAvailableTokens(address _addr) private view returns(uint256) {
        uint256 vestingTimeElapsed = block.timestamp - vestingStartTime - cliffPeriod;
        uint256 maxTokensToClaim = tokensPerBeneficiaryOfRole[beneficiaries[_addr].role];
        uint256 tokensClaimed = beneficiaries[_addr].totalTokensClaimed;

        if (vestingTimeElapsed >= vestingPeriod) {
            return maxTokensToClaim - tokensClaimed;
        }
        
        uint256 totalTokensVestedTillNow = (vestingTimeElapsed * maxTokensToClaim) / vestingPeriod;
        return (totalTokensVestedTillNow - tokensClaimed);
    }

}
