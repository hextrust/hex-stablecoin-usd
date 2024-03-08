//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {PausableWithRolesUpgradeable} from "contracts/PausableWithRolesUpgradeable.sol";
import {Context} from "contracts/utils/Context.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title BlacklistableWithRolesUpgradeable
 * @dev Allows users to be blacklisted or unblacklisted by BLACKLISTER_ROLE
 */

abstract contract BlacklistableWithRolesUpgradeable is
    PausableWithRolesUpgradeable
{
    /// @custom:storage-location erc7201:BlacklistableStorage
    struct BlacklistableStorage {
        mapping(address => bool) blacklisted;
    }

    // keccak256(abi.encode(uint256(keccak256("storage.blacklistable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant BlacklistableStorageLocation =
        0x7b8c66b06ab2a5b9694594d3e1497062eaf332a02e6508b6950edd463f4bb000;

    function _getBlacklistableStorageLocation()
        private
        pure
        returns (BlacklistableStorage storage $)
    {
        assembly {
            $.slot := BlacklistableStorageLocation
        }
    }

    /**
     * @dev Emitted when the user is blacklisted
     */
    event AddedBlacklist(address user);

    /**
     * @dev Emitted when the user is removed from blacklist
     */
    event RemovedBlacklist(address user);

    /**
     * @dev Modifier to prevent blacklisting the contract
     */
    modifier notBlacklistThisContract(address addr) {
        if (addr == address(this)) revert NotBlacklistThisContract();
        _;
    }

    /**
     * @dev Modifier to prevent blacklisting the owner and BLACKLISTER_ROLE
     */
    modifier notBlacklistMember(address addr) {
        if (addr == owner()) revert BlacklistNotAllowed();
        if (hasRole(RoleConstant.BLACKLISTER_ROLE, addr))
            revert BlacklistNotAllowed();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the user is not blacklisted.
     */
    modifier whenNotBlacklisted(address user) {
        BlacklistableStorage storage $ = _getBlacklistableStorageLocation();
        if ($.blacklisted[user]) revert AlreadyBlacklisted(user);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the user is already blacklisted.
     */
    modifier whenBlacklisted(address user) {
        BlacklistableStorage storage $ = _getBlacklistableStorageLocation();
        if (!$.blacklisted[user]) revert NotBlacklisted(user);
        _;
    }

    /**
     * @dev The operation failed because the address is already blacklisted
     */
    error AlreadyBlacklisted(address sender);

    /**
     * @dev The operation failed because the address is not blacklisted
     */
    error NotBlacklisted(address sender);

    /**
     * @dev The operation failed because the contract cannot be blacklisted
     */
    error NotBlacklistThisContract();

    /**
     * @dev The operation failed because address can not be blacklisted
     */
    error BlacklistNotAllowed();

    /**
     * @dev Initialize
     */
    function __BlacklistableWithRoles_init() internal onlyInitializing {}

    /**
     * @notice Remove a blacklisted user
     * @param user - The address of the user to be removed from blacklist
     */
    function removeBlacklist(
        address user
    )
        external
        onlyRole(RoleConstant.BLACKLISTER_ROLE)
        nonZA(user)
        whenBlacklisted(user)
        whenNotPaused
    {
        BlacklistableStorage storage $ = _getBlacklistableStorageLocation();
        $.blacklisted[user] = false;
        emit RemovedBlacklist(user);
    }

    /**
     * @notice Add the user in blacklist
     * @param user - The address of the user to be added in blakclist
     */
    function addBlacklist(
        address user
    )
        external
        onlyRole(RoleConstant.BLACKLISTER_ROLE)
        nonZA(user)
        whenNotBlacklisted(user)
        notBlacklistThisContract(user)
        notBlacklistMember(user)
        whenNotPaused
    {
        BlacklistableStorage storage $ = _getBlacklistableStorageLocation();
        $.blacklisted[user] = true;
        emit AddedBlacklist(user);
    }

    /**
     * @notice Function for check the blacklist status of the user:
     * @param user - Address of the user
     * @return - Boolean value if it's blacklisted or not
     */
    function isBlacklisted(address user) external view returns (bool) {
        BlacklistableStorage storage $ = _getBlacklistableStorageLocation();
        return $.blacklisted[user];
    }
}
