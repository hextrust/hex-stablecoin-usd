import { ethers } from "hardhat";

export const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
export const BURNER_ROLE = ethers.utils.id('BURNER_ROLE');
export const BLACKLISTER_ROLE = ethers.utils.id('BLACKLISTER_ROLE');
export const UPGRADE_ADMIN_ROLE = ethers.utils.id('UPGRADE_ADMIN_ROLE');
export const PAUSER_ROLE = ethers.utils.id('PAUSER_ROLE');
export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
