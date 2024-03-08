// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

abstract contract Context {
    /**
     * @dev The operation failed because the address is already zero address
     */
    error ZeroAddress();

    /**
     * @dev The operation failed because it is zero value
     */
    error ZeroValue();

    /**
     * @dev Modifier to prevent calling zero address
     */
    modifier nonZA(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }

    /**
     * @dev Modifier to prevent zero value
     */
    modifier nonZV(uint256 amount) {
        if (amount == 0) revert ZeroValue();
        _;
    }
}
