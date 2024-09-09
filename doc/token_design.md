# Hex Stablecoin Design

HTMI issued USD backed ERC-20 token smart contract which is minted and burned by HTMI Limited and is backed by USD reserve managed by trusted custodian. UUPS proxies are implemented using an [ERC-1967](https://eips.ethereum.org/EIPS/eip-1967) for upgrade the contract for bug fixing or additional features.

## Roles

Hashed string values for each roles are defined in [RoleConstant.sol](./contracts/utils/RoleConstant.sol) 

- MINTER_ROLE: issue / create / mint token. Increase total supply
- BURNER_ROLE: destroy / burn token. Burning burner's address balance
- PAUSER_ROLE: pause the contract for all transfers, minting, and burning
- BLACKLISTER_ROLE: edit blacklisted user list which prevent all balance update. Including all transfers to or from / minting to / burning from blacklisted address
- UPGRADE_ADMIN_ROLE: manage the proxy-level functionalities such as switching the implementation contract
- DEFAULT_ADMIN_ROLE: manage admin role granting

## ERC20WithRolesUpgradeable.sol

USDX implements the standard methods of the ERC-20 interface with admin role limitation.
Define ERC-20 Functionalities along with supply control functions (minting and burning). We have also introduced a function to seize the Token of a blacklisted party when required.

- `transfer`, `transferFrom` will fail if the contract has been paused.
- `burnBlackFunds(address blacklistedAccount)` : BURNER_ROLE can burn blacklisted address balance

## AccessControlDefaultAdminRulesUpgradeable.sol

Extension of {AccessControl} that allows specifying special rules to manage the `DEFAULT_ADMIN_ROLE` holder, which is a sensitive role with special permissions over other roles that may potentially have privileged rights in the system.

This is forked from Openzepplin's [AccessControlDefaultAdminRulesUpgradeable.sol](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol).

- `pendingDefaultAdmin()`
- `beginDefaultAdminTransfer(address newAdmin)`
- `cancelDefaultAdminTransfer()`
- `acceptDefaultAdminTransfer()`

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
