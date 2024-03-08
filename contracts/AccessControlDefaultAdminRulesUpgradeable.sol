// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IAccessControlDefaultAdminRules} from "./interface/IAccessControlDefaultAdminRules.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC5313} from "@openzeppelin/contracts/interfaces/IERC5313.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Forked from https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol
 * @dev Extension of {AccessControl} that allows specifying special rules to manage
 * the `DEFAULT_ADMIN_ROLE` holder, which is a sensitive role with special permissions
 * over other roles that may potentially have privileged rights in the system.
 *
 * Changes:
 * 1. Change initializers to remove initialDelay
 * 2. Remove time delay related functions: _pendingDefaultAdminSchedule, _currentDelay, _pendingDelay, _pendingDelaySchedule
 * defaultAdminDelay, pendingDefaultAdminDelay, defaultAdminDelayIncreaseWait, changeDefaultAdminDelay, _changeDefaultAdminDelay
 * changeDefaultAdminDelay, _changeDefaultAdminDelay, rollbackDefaultAdminDelay, _rollbackDefaultAdminDelay
 * _delayChangeWait, _setPendingDelay, _isScheduleSet, _hasSchedulePassed
 * 3. Remove renounceRole() function
 * 4. Remove _pendingDefaultAdminSchedule from pendingDefaultAdmin function
 * 5. Remove time delay elements from _beginDefaultAdminTransfer and _setPendingDefaultAdmin
 * 7. Change _acceptDefaultAdminTransfer to remove time delay elements
 */

abstract contract AccessControlDefaultAdminRulesUpgradeable is
    Initializable,
    IAccessControlDefaultAdminRules,
    IERC5313,
    AccessControlUpgradeable
{
    /// @custom:storage-location erc7201:openzeppelin.storage.AccessControlDefaultAdminRules
    struct AccessControlDefaultAdminRulesStorage {
        // pending admin pair read/written together frequently
        address _pendingDefaultAdmin;
        address _currentDefaultAdmin;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.AccessControlDefaultAdminRules")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant AccessControlDefaultAdminRulesStorageLocation =
        0xeef3dac4538c82c8ace4063ab0acd2d15cdb5883aa1dff7c2673abb3d8698400;

    function _getAccessControlDefaultAdminRulesStorage()
        private
        pure
        returns (AccessControlDefaultAdminRulesStorage storage $)
    {
        assembly {
            $.slot := AccessControlDefaultAdminRulesStorageLocation
        }
    }

    /**
     * @dev Sets the initial values for {defaultAdmin} address.
     */
    function __AccessControlDefaultAdminRules_init(
        address initialDefaultAdmin
    ) internal onlyInitializing {
        __AccessControlDefaultAdminRules_init_unchained(initialDefaultAdmin);
    }

    function __AccessControlDefaultAdminRules_init_unchained(
        address initialDefaultAdmin
    ) internal onlyInitializing {
        if (initialDefaultAdmin == address(0)) {
            revert AccessControlInvalidDefaultAdmin(address(0));
        }
        _grantRole(DEFAULT_ADMIN_ROLE, initialDefaultAdmin);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IAccessControlDefaultAdminRules).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC5313-owner}.
     */
    function owner() public view virtual returns (address) {
        return defaultAdmin();
    }

    ///
    /// Override AccessControl role management
    ///

    /**
     * @dev See {AccessControl-grantRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function grantRole(
        bytes32 role,
        address account
    ) public virtual override(AccessControlUpgradeable, IAccessControl) {
        if (role == DEFAULT_ADMIN_ROLE) {
            revert AccessControlEnforcedDefaultAdminRules();
        }
        super.grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-revokeRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function revokeRole(
        bytes32 role,
        address account
    ) public virtual override(AccessControlUpgradeable, IAccessControl) {
        if (role == DEFAULT_ADMIN_ROLE) {
            revert AccessControlEnforcedDefaultAdminRules();
        }
        super.revokeRole(role, account);
    }

    /**
     * @dev See {AccessControl-_grantRole}.
     *
     * For `DEFAULT_ADMIN_ROLE`, it only allows granting if there isn't already a {defaultAdmin}
     *
     * NOTE: Exposing this function through another mechanism may make the `DEFAULT_ADMIN_ROLE`
     * assignable again. Make sure to guarantee this is the expected behavior in your implementation.
     */
    function _grantRole(
        bytes32 role,
        address account
    ) internal virtual override returns (bool) {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        if (role == DEFAULT_ADMIN_ROLE) {
            if (defaultAdmin() != address(0)) {
                revert AccessControlEnforcedDefaultAdminRules();
            }
            $._currentDefaultAdmin = account;
        }
        return super._grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-_revokeRole}.
     */
    function _revokeRole(
        bytes32 role,
        address account
    ) internal virtual override returns (bool) {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        if (role == DEFAULT_ADMIN_ROLE && account == defaultAdmin()) {
            delete $._currentDefaultAdmin;
        }
        return super._revokeRole(role, account);
    }

    /**
     * @dev See {AccessControl-_setRoleAdmin}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function _setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            revert AccessControlEnforcedDefaultAdminRules();
        }
        super._setRoleAdmin(role, adminRole);
    }

    ///
    /// AccessControlDefaultAdminRules accessors
    ///

    /**
     * @inheritdoc IAccessControlDefaultAdminRules
     */
    function defaultAdmin() public view virtual returns (address) {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        return $._currentDefaultAdmin;
    }

    /**
     * @inheritdoc IAccessControlDefaultAdminRules
     */
    function pendingDefaultAdmin()
        public
        view
        virtual
        returns (address newAdmin)
    {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        return $._pendingDefaultAdmin;
    }

    ///
    /// AccessControlDefaultAdminRules public and internal setters for defaultAdmin/pendingDefaultAdmin
    ///

    /**
     * @inheritdoc IAccessControlDefaultAdminRules
     */
    function beginDefaultAdminTransfer(
        address newAdmin
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _beginDefaultAdminTransfer(newAdmin);
    }

    /**
     * @dev See {beginDefaultAdminTransfer}.
     *
     * Internal function without access restriction.
     */
    function _beginDefaultAdminTransfer(address newAdmin) internal virtual {
        _setPendingDefaultAdmin(newAdmin);
        emit DefaultAdminTransferScheduled(newAdmin);
    }

    /**
     * @inheritdoc IAccessControlDefaultAdminRules
     */
    function cancelDefaultAdminTransfer()
        public
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _cancelDefaultAdminTransfer();
    }

    /**
     * @dev See {cancelDefaultAdminTransfer}.
     *
     * Internal function without access restriction.
     */
    function _cancelDefaultAdminTransfer() internal virtual {
        _setPendingDefaultAdmin(address(0));
    }

    /**
     * @inheritdoc IAccessControlDefaultAdminRules
     */
    function acceptDefaultAdminTransfer() public virtual {
        address newDefaultAdmin = pendingDefaultAdmin();
        if (_msgSender() != newDefaultAdmin) {
            // Enforce newDefaultAdmin explicit acceptance.
            revert AccessControlInvalidDefaultAdmin(_msgSender());
        }
        _acceptDefaultAdminTransfer();
    }

    /**
     * @dev See {acceptDefaultAdminTransfer}.
     *
     * Internal function without access restriction.
     */
    function _acceptDefaultAdminTransfer() internal virtual {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        address newAdmin = pendingDefaultAdmin();
        _revokeRole(DEFAULT_ADMIN_ROLE, defaultAdmin());
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        delete $._pendingDefaultAdmin;
    }

    ///
    /// Private setters
    ///

    /**
     * @dev Setter of pending admin
     *
     * May emit a DefaultAdminTransferCanceled event.
     */
    function _setPendingDefaultAdmin(address newAdmin) private {
        AccessControlDefaultAdminRulesStorage
            storage $ = _getAccessControlDefaultAdminRulesStorage();
        $._pendingDefaultAdmin = newAdmin;
    }
}
