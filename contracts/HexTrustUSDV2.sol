//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20WithRolesUpgradeable} from "contracts/ERC20WithRolesUpgradeable.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title ERC20 Upgradable token with the name 'HexTrustUSD'
 */

contract HexTrustUSDV2 is UUPSUpgradeable, ERC20WithRolesUpgradeable {
    bytes32 private constant ERC20StorageLocation =
        0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00;
    event UpdateSymbol(string symbol_);

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

    function _getERC20StorageEditable()
        private
        view
        onlyRole(RoleConstant.UPGRADE_ADMIN_ROLE)
        returns (ERC20Storage storage $)
    {
        assembly {
            $.slot := ERC20StorageLocation
        }
    }

    function updateName(string memory name_) external virtual {
        ERC20Storage storage $ = _getERC20StorageEditable();
        $._name = name_;
    }

    function updateSymbol(string memory symbol_) external virtual {
        ERC20Storage storage $ = _getERC20StorageEditable();
        $._symbol = symbol_;
    }

    // VERSIONS
    function getVersion() external pure virtual returns (uint256) {
        return 2;
    }
}
