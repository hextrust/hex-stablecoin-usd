// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library RoleConstant {
    /**
     * @dev hashed role string
     * MINTER_ROLE: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
     * BURNER_ROLE: 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
     * PAUSER_ROLE: 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a
     * UPGRADE_ADMIN_ROLE: 0xf5e41b69db3149675767a8769b58cb4060b90e5e3d4bab8b1c958708ed9c9259
     * BLACKLISTER_ROLE: 0x98db8a220cd0f09badce9f22d0ba7e93edb3d404448cc3560d391ab096ad16e9
     * MERCHANTS_ROLE: 0xb2b5b7f126fca9c90fed6ed9b87fe3805da60c5b8555ed91e6723b29ec089beb
     */

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADE_ADMIN_ROLE =
        keccak256("UPGRADE_ADMIN_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant MERCHANTS_ROLE = keccak256("MERCHANTS_ROLE");
}
