//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {AccessControlDefaultAdminRulesUpgradeable} from "contracts/AccessControlDefaultAdminRulesUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Context} from "contracts/utils/Context.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title PausableWithRolesUpgradeable
 * @dev Allows contract to be paused by PAUSER_ROLE
 */

abstract contract PausableWithRolesUpgradeable is
    Context,
    PausableUpgradeable,
    AccessControlDefaultAdminRulesUpgradeable
{
    /**
     * @dev initialize
     */
    function __PausableWithRoles_init() internal onlyInitializing {}

    /**
     * @dev Triggers stopped state.
     */
    function pause() external virtual onlyRole(RoleConstant.PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     */
    function unpause() external virtual onlyRole(RoleConstant.PAUSER_ROLE) {
        _unpause();
    }
}
