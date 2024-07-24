# Hex Stablecoin (USDX)

HTMI issued USD backed ERC-20 token smart contract

# Deployed Contract Addresses

|        Chain       |                  Address                   |
|:-------------------|:------------------------------------------:|
| Ethereum Mainnet   | 0x7A486F809c952a6f8dEc8cb0Ff68173F2B8ED56c |
| Flare Mainnet      | 0x4A771Cc1a39FDd8AA08B8EA51F7Fd412e73B3d2B |
| Songbird Mainnet   | 0x4A771Cc1a39FDd8AA08B8EA51F7Fd412e73B3d2B |

The contract was audited by third party provide, Hacken in December 2023. Audit report can be found [here](./audit/Hex_Trust_SC_Audit_24_11_23_[SA2049]_final.pdf).

# Contract details

USDX is ERC-20 token that is minted and burned by HTMI Limited and is backed by USD reserve managed by trusted custodian.

## HexStableCoin.sol

Upgradable (UUPS) ERC-20 Token contract named HexStableCoin. UUPS proxies are implemented using an [ERC-1967](https://eips.ethereum.org/EIPS/eip-1967).

## ERC20WithRolesUpgradeable.sol

Define ERC-20 Functionalities along with supply control functions (minting and burning). We have also introduced a function to seize the Token of a blacklisted party when required.

- `totalSupply()`
- `balanceOf(address account)`
- `transfer(address recipient, uint256 value)`
- `allowance(address owner, address spender)`
- `approve(address spender, uint256 amount)`
- `transferFrom(address from, address to, uint256 value)`
- `decimals()`
- `mint(address to, uint256 amount)`
- `burn(uint256 amount)`
- `burnBlackFunds(address blacklistedAccount)`

## AccessControlDefaultAdminRulesUpgradeable.sol

Extension of {AccessControl} that allows specifying special rules to manage the `DEFAULT_ADMIN_ROLE` holder, which is a sensitive role with special permissions over other roles that may potentially have privileged rights in the system.

This is forked from Openzepplin's [AccessControlDefaultAdminRulesUpgradeable.sol](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol).

- `__AccessControlDefaultAdminRules_init(address initialDefaultAdmin)`
- `supportsInterface(bytes4 interfaceId)`
- `owner()`
- `grantRole(bytes32 role, address account)`
- `revokeRole(bytes32 role, address account)`
- `renounceRole(bytes32 role, address account)`
- `defaultAdmin()`
- `pendingDefaultAdmin()`
- `beginDefaultAdminTransfer(address newAdmin)`
- `cancelDefaultAdminTransfer()`
- `acceptDefaultAdminTransfer()`

Hashed string values for each roles are defined in RoleConstant.sol library.

- MINTER_ROLE: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- BURNER_ROLE: `0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848`
- PAUSER_ROLE: `0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a`
- BLACKLISTER_ROLE: `0x98db8a220cd0f09badce9f22d0ba7e93edb3d404448cc3560d391ab096ad16e9`
- UPGRADE_ADMIN_ROLE: `0xf5e41b69db3149675767a8769b58cb4060b90e5e3d4bab8b1c958708ed9c9259`
- MERCHANTS_ROLE: 0xb2b5b7f126fca9c90fed6ed9b87fe3805da60c5b8555ed91e6723b29ec089beb

## BlacklistableWithRolesUpgradeable.sol

Functions to allow and remove blacklisted users in the contract. Only `BLACKLISTER_ROLE` can add or remove blacklisted users.

- `addBlacklist(address user)`
- `removeBlacklist(address user)`
- `isBlacklisted(address user)`

## PausableUpgradeable.sol

Functions to pause and unpause transfer in the event of emergency. Inherited from Openzepplin PausableUpgradeable.sol. Only `PAUSER_ROLE` can control the functions.

- `pause()`
- `unpause()`

## Upgradability

Upgradable mechanism is based on UUPS proxies pattern. The \_authorizeUpgrade function is overridden to include access restriction to the upgrade mechanism allowed only by `UPGRADE_ADMIN_ROLE` and defaultAdmin

# Hardhat project:

_In this project using "Yarn"_

- `yarn init -y` - for installing the _Yarn_;
- `yarn install` - installs all _dependencies_;
- `yarn build` - for _compiling_ contracts;
- `yarn test` - for _testing_ contracts;
- `yarn coverage` - shows smart contract _coverage_;
