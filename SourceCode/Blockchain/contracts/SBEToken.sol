// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SBEToken is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // _disableInitializers();
        initialize();
        admin = payable(owner());
    }

    address payable admin;

    event mintEvent(address to, uint256 amount, uint256 timestamp);
    event paymentEvent(
        uint256 orderId,
        address user,
        address adminAddress,
        uint256 amount,
        uint256 _discount,
        uint256 timestamp
    );
    event refundEvent(
        uint256 orderId,
        address user,
        address adminAddress,
        uint256 amount,
        uint256 coinRefund,
        uint256 timestamp
    );
    event transferEvent(
        address from,
        address to,
        uint256 amount,
        uint256 timestamp
    );

    function initialize() internal initializer {
        __ERC20_init("ShopByETH", "SBE");
        __ERC20Burnable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        _approve(to, msg.sender, amount);
        emit mintEvent(to, amount, block.timestamp);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function makePayment(uint256 _discount, uint256 orderId) public payable {
        require(
            balanceOf(msg.sender) >= _discount,
            "Insufficient coin balance for user."
        );
        admin.transfer(msg.value);
        _burn(msg.sender, _discount);
        emit paymentEvent(
            orderId,
            msg.sender,
            admin,
            msg.value,
            _discount,
            block.timestamp
        );
    }

    function transferToken(uint256 _amount) public {
        transfer(admin, _amount);
        emit transferEvent(msg.sender, admin, _amount, block.timestamp);
    }

    function adminTransferToken(address _user, uint256 _amount)
        external
        onlyOwner
    {
        transfer(_user, _amount);
        emit transferEvent(msg.sender, _user, _amount, block.timestamp);
    }

    function clearContractBalance() external onlyOwner {
        admin.transfer(address(this).balance);
    }

    function refund(
        address user,
        uint256 _coinRefund,
        uint256 orderId
    ) external payable onlyOwner {
        address payable _user = payable(user);
        _user.transfer(msg.value);
        _mint(user, _coinRefund);
        _approve(user, msg.sender, _coinRefund);
        emit refundEvent(
            orderId,
            user,
            msg.sender,
            msg.value,
            _coinRefund,
            block.timestamp
        );
    }
}