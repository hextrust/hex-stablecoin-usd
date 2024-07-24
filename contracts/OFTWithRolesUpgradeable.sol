// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20WithRolesUpgradeable} from "./ERC20WithRolesUpgradeable.sol";
import {IOFT, OFTCoreUpgradeable} from "../layerzero/oapp/contracts/oft/OFTCoreUpgradeable.sol";
import {AccessControlDefaultAdminRulesUpgradeable} from "contracts/AccessControlDefaultAdminRulesUpgradeable.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";
import {EnforcedOptionParam} from "../layerzero/oapp/contracts/oapp/interfaces/IOAppOptionsType3.sol";

/**
 * @title OFT Contract
 * @dev OFT is an ERC-20 token that extends the functionality of the OFTCore contract.
 * Changes:
 * 1. Upgradable
 * 2. apply isAuthorizedOperator() to custom admin access for OFT
 */
abstract contract OFTWithRolesUpgradeable is OFTCoreUpgradeable, ERC20WithRolesUpgradeable {
    /**
     * @dev Constructor for the OFT contract.
     * @param _lzEndpoint The LayerZero endpoint address.
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(uint8 _decimals, address _lzEndpoint) OFTCoreUpgradeable(_decimals, _lzEndpoint) {}

    /**
     * @dev Initialize
     */
    function __OFT_init() internal onlyInitializing {}

    function __OFT_init_unchained() internal onlyInitializing {}

    /**
     * @notice Retrieves interfaceID and the version of the OFT.
     * @return interfaceId The interface ID.
     * @return version The version.
     *
     * @dev interfaceId: This specific interface ID is '0x02e49c2c'.
     * @dev version: Indicates a cross-chain compatible msg encoding with other OFTs.
     * @dev If a new feature is added to the OFT cross-chain msg encoding, the version will be incremented.
     * ie. localOFT version(x,1) CAN send messages to remoteOFT version(x,1)
     */
    function oftVersion() external pure virtual returns (bytes4 interfaceId, uint64 version) {
        return (type(IOFT).interfaceId, 1);
    }

    /**
     * @dev Retrieves the address of the underlying ERC20 implementation.
     * @return The address of the OFT token.
     *
     * @dev In the case of OFT, address(this) and erc20 are the same contract.
     */
    function token() external view returns (address) {
        return address(this);
    }

    /**
     * @notice Indicates whether the OFT contract requires approval of the 'token()' to send.
     * @return requiresApproval Needs approval of the underlying token implementation.
     *
     * @dev In the case of OFT where the contract IS the token, approval is NOT required.
     */
    function approvalRequired() external pure virtual returns (bool) {
        return false;
    }

    /**
     * @dev Returns true for authorized operator who has access right to update OApp configurations
     */
    function isAuthorizedOperator(address _address) public view override returns (bool) {
        return isDefaultAdmin(_address) || hasRole(RoleConstant.UPGRADE_ADMIN_ROLE, _address);
    }

    /**
     * @dev Burns tokens from the sender's specified balance.
     * @param _amountLD The amount of tokens to send in local decimals.
     * @param _minAmountLD The minimum amount to send in local decimals.
     * @param _dstEid The destination chain ID.
     * @return amountSentLD The amount sent in local decimals.
     * @return amountReceivedLD The amount received in local decimals on the remote.
     */
    function _debit(uint256 _amountLD, uint256 _minAmountLD, uint32 _dstEid)
        internal
        virtual
        override
        returns (uint256 amountSentLD, uint256 amountReceivedLD)
    {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);

        // @dev In NON-default OFT, amountSentLD could be 100, with a 10% fee, the amountReceivedLD amount is 90,
        // therefore amountSentLD CAN differ from amountReceivedLD.

        // @dev Default OFT burns on src.
        _burn(msg.sender, amountSentLD);
    }

    /**
     * @dev Credits tokens to the specified address.
     * @param _to The address to credit the tokens to.
     * @param _amountLD The amount of tokens to credit in local decimals.
     * @dev _srcEid The source chain ID.
     * @return amountReceivedLD The amount of tokens ACTUALLY received in local decimals.
     */
    function _credit(address _to, uint256 _amountLD, uint32 /*_srcEid*/ )
        internal
        virtual
        override
        returns (uint256 amountReceivedLD)
    {
        // @dev Default OFT mints on dst.
        _mint(_to, _amountLD);
        // @dev In the case of NON-default OFT, the _amountLD MIGHT not be == amountReceivedLD.
        return _amountLD;
    }
}
