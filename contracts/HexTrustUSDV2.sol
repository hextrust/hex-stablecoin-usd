//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OFTWithRolesUpgradeable} from "contracts/OFTWithRolesUpgradeable.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title ERC20 Upgradable token with the name 'HexTrustUSD'
 * Changes from V1:
 * 1. Extend OFT standard for LayerZero support
 * 2. _authorizeUpgrade() allow upgrade contract by defaultAdmin & when the contract is paused
 */
contract HexTrustUSDV2 is UUPSUpgradeable, OFTWithRolesUpgradeable {
    /**
     * @param _decimals ERC20's decimals, for calculate decimalConversionRate in OFT
     * @param _lzEndpoint The LayerZero endpoint address.
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(uint8 _decimals, address _lzEndpoint) OFTWithRolesUpgradeable(_decimals, _lzEndpoint) {}

    /**
     * @dev Initializing the OFT, setting delegate of the OFT;
     */
    function initializeV2(address _delegate)
        external
        reinitializer(2)
    {
        __OFTCore_init(_delegate);
    }

    /**
     * @dev required by the OZ UUPS module
     * - Setting upgradability control as UPGRADE_ADMIN_ROLE & defaultAdmin
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRoleOrDefaultAdmin(RoleConstant.UPGRADE_ADMIN_ROLE)
    {}

    // VERSIONS
    function getVersion() external pure virtual returns (uint256) {
        return 2;
    }
}
