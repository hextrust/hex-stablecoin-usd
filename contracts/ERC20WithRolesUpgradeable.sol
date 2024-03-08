//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {BlacklistableWithRolesUpgradeable} from "contracts/BlacklistableWithRolesUpgradeable.sol";
import {RoleConstant} from "contracts/utils/RoleConstant.sol";

/**
 * @title ERC20WithRolesUpgradeable
 * @dev ERC20 implementation
 */

abstract contract ERC20WithRolesUpgradeable is
    ERC20Upgradeable,
    BlacklistableWithRolesUpgradeable
{
    /// @custom:storage-location erc7201:ERC20PermitWithRolesStorage
    struct ERC20WithRolesStorage {
        uint8 __decimals;
    }

    // keccak256(abi.encode(uint256(keccak256("storage.erc20withroles")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ERC20WithRolesStorageLocation =
        0x3ab444d0b836415993da5574d0dceaa00602de23a5d497ad94b3647348c27000;

    function _getERC20WithRolesStorageLocation()
        private
        pure
        returns (ERC20WithRolesStorage storage $)
    {
        assembly {
            $.slot := ERC20WithRolesStorageLocation
        }
    }

    /**
     * @dev Emitted when the token is retrieved from contract
     */
    event TokenRetrieved();

    /**
     * @dev sets admin of MINTER_ROLE,BURNER_ROLE as DEFAULT_ADMIN_ROLE
     * - Setting and saving the token name, symbol
     * @param _name name
     * @param _symbol symbol
     * @param _decimals decimal
     */
    function __ERC20WithRoles_init(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) internal onlyInitializing {
        ERC20WithRolesStorage storage $ = _getERC20WithRolesStorageLocation();
        __ERC20_init(_name, _symbol);
        $.__decimals = _decimals;
    }

    /**
     * @dev return decimals of the token
     */
    function decimals() public view override returns (uint8) {
        ERC20WithRolesStorage storage $ = _getERC20WithRolesStorageLocation();
        return $.__decimals;
    }

    /**
     * @dev control transfer of token from/to unblacklisted address
     * @param from - Address
     * @param to - Address where token are transferred to
     * @param value - Number of tokens to be transferred
     */
    function _update(
        address from,
        address to,
        uint256 value
    )
        internal
        virtual
        override
        whenNotBlacklisted(from)
        whenNotBlacklisted(to)
        whenNotPaused
    {
        super._update(from, to, value);
    }

    // TOKEN SUPPLY
    /**
     * @dev Mint a new amount of tokens for specific address
     * @param to - Address for recipient
     * @param amount - Number of tokens to be minted
     */
    function mint(
        address to,
        uint256 amount
    ) external virtual onlyRole(RoleConstant.MINTER_ROLE) nonZV(amount) {
        _mint(to, amount);
    }

    /**
     * @dev Remove a certain amount of tokens from burner's balance.
     * @param amount - Number of tokens to be burned
     */
    function burn(
        uint256 amount
    ) external virtual onlyRole(RoleConstant.BURNER_ROLE) nonZV(amount) {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Remove a total amount of tokens from blacklisted account
     * @param blacklistedAccount - address of blacklisted where the funds will be burned
     */
    function burnBlackFunds(
        address blacklistedAccount
    )
        external
        virtual
        onlyRole(RoleConstant.BLACKLISTER_ROLE)
        whenBlacklisted(blacklistedAccount)
    {
        uint256 burnAmount = balanceOf(blacklistedAccount);
        super._update(blacklistedAccount, address(0), burnAmount);
    }
}
