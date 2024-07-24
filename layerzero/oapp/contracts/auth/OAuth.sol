// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @title OAuthUpgradeable
 * @dev Abstract contract implementing the IOAuth interface which perform access right for configurations updates.
 */
abstract contract OAuth {
    /**
     * @dev Returns true for authorized operator who has access right to update OApp configurations
     */
    function isAuthorizedOperator(address _address) public view virtual returns (bool);

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to update configuration of the contract. Called by
     * {setDelegate} , {setPeer} ... etc
     *
     */
    function _checkAuthorizeOperator() internal view virtual {
        require(isAuthorizedOperator(msg.sender), "OAuth: caller is not the authorized operator");
    }
}
