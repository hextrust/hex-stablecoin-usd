//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20WithRolesUpgradeable} from "contracts/ERC20WithRolesUpgradeable.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title ERC20 Upgradable token with the name 'HexTrustUSD'
 */

contract HexTrustUSD is UUPSUpgradeable, ERC20WithRolesUpgradeable {
    /**
     * @dev Initializing the ERC20, setting name, decimals and symbol;
     * - Setting and saving the token name, symbol and decimals
     * - Setting _owner as DEFAULT_ADMIN_ROLE
     * - Setting role admin of  UPGRADE_ADMIN_ROLE as DEFAULT_ADMIN_ROLE
     * @param _owner - Initial owner
     * @param _name - Token name
     * @param _symbol - Symbol
     * @param _decimals - Decimal
     */
    function initialize(
        address _owner,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external initializer nonZA(_owner) {
        __UUPSUpgradeable_init();
        __AccessControlDefaultAdminRules_init(_owner);
        __PausableWithRoles_init();
        __BlacklistableWithRoles_init();
        __ERC20WithRoles_init(_name, _symbol, _decimals);
        __AccessControl_init();
        __Pausable_init();
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev required by the OZ UUPS module
     * - Setting upgradability control as UPGRADE_ADMIN_ROLE
     */
    function _authorizeUpgrade(
        address newImplementation
    )
        internal
        override
        onlyRole(RoleConstant.UPGRADE_ADMIN_ROLE)
        whenNotPaused
    {}

    // VERSIONS
    function getVersion() external pure virtual returns (uint256) {
        return 1;
    }
}
