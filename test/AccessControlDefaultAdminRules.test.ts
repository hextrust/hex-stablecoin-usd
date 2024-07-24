import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployContract } from './Utils';
import { ethers, web3 } from 'hardhat';
import { BLACKLISTER_ROLE, BURNER_ROLE, DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, UPGRADE_ADMIN_ROLE } from './Consts';
import { Contract } from 'ethers';

const AddressZero = ethers.constants.AddressZero;
const ROLE = web3.utils.soliditySha3('ROLE');

describe('AccessControlDefaultAdminRulesUpgradeable', function () {
    let contract: Contract;
    let deployer: SignerWithAddress,
        owner1: SignerWithAddress,
        minerRoleUser: SignerWithAddress,
        burnerRoleUser: SignerWithAddress,
        pauserRoleUser: SignerWithAddress,
        upgradeAdminRoleUser: SignerWithAddress,
        blacklistRoleUser: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        user3: SignerWithAddress;
    beforeEach(async function () {
        ({ contract, deployer, owner1, minerRoleUser, burnerRoleUser, pauserRoleUser, upgradeAdminRoleUser, blacklistRoleUser, user1, user2, user3 } =
            await loadFixture(deployContract));
    });
    describe('supportsInterface', function () {
        it('should support ERC165', async function () {
            expect(await contract.supportsInterface('0x01ffc9a7')).to.be.true;
        });
    });

    describe('defaultAdmin', function () {
        it('should return deployer address after first deployment', async function () {
            expect(await contract.defaultAdmin()).to.equal(deployer.address);
        });
    });

    describe('pendingDefaultAdmin', function () {
        it('should return zero after first deployment', async function () {
            expect(await contract.pendingDefaultAdmin()).to.equal(AddressZero);
        });
    });

    describe('isDefaultAdmin', function () {
        it('should return true for defaultAdmin only', async function () {
            expect(await contract.isDefaultAdmin(deployer.address)).to.be.true;
            expect(await contract.isDefaultAdmin(user1.address)).to.be.false;
            expect(await contract.isDefaultAdmin(upgradeAdminRoleUser.address)).to.be.false;
        });
        it('should return true for current defaultAdmin only', async function () {
            expect(await contract.isDefaultAdmin(deployer.address)).to.be.true;
            expect(await contract.isDefaultAdmin(owner1.address)).to.be.false;
            await contract.connect(deployer).beginDefaultAdminTransfer(owner1.address);
            await contract.connect(owner1).acceptDefaultAdminTransfer();
            expect(await contract.isDefaultAdmin(deployer.address)).to.be.false;
            expect(await contract.isDefaultAdmin(owner1.address)).to.be.true;
        });
    });

    describe('hasRole', function () {
        it('should be false when hasRole() before grantRole', async function () {
            for (const role of [MINTER_ROLE, BURNER_ROLE, PAUSER_ROLE, BLACKLISTER_ROLE, UPGRADE_ADMIN_ROLE]) {
                expect(await contract.hasRole(role, deployer.address)).to.be.false;
            }
            for (const [role, user] of [
                [MINTER_ROLE, minerRoleUser],
                [BURNER_ROLE, burnerRoleUser],
                [PAUSER_ROLE, pauserRoleUser],
                [BLACKLISTER_ROLE, blacklistRoleUser],
                [UPGRADE_ADMIN_ROLE, upgradeAdminRoleUser],
            ]) {
                expect(await contract.hasRole(role, (user as SignerWithAddress).address)).to.be.false;
            }
        });
    });

    describe('grantRole', function () {
        it('should be true when hasRole() after grantRole', async function () {
            for (const [role, user] of [
                [MINTER_ROLE, minerRoleUser],
                [BURNER_ROLE, burnerRoleUser],
                [PAUSER_ROLE, pauserRoleUser],
                [BLACKLISTER_ROLE, blacklistRoleUser],
                [UPGRADE_ADMIN_ROLE, upgradeAdminRoleUser],
            ]) {
                expect(await contract.hasRole(role, (user as SignerWithAddress).address)).to.be.false;
                await contract.connect(deployer).grantRole(role, (user as SignerWithAddress).address);
                expect(await contract.hasRole(role, (user as SignerWithAddress).address)).to.be.true;
            }
            for (const role of [MINTER_ROLE, BURNER_ROLE, PAUSER_ROLE, BLACKLISTER_ROLE, UPGRADE_ADMIN_ROLE]) {
                expect(await contract.hasRole(role, deployer.address)).to.be.false;
                await contract.connect(deployer).grantRole(role, deployer.address);
                expect(await contract.hasRole(role, deployer.address)).to.be.true;
            }
        });

        it('should revert when called by non defaultAdmin', async function () {
            await expect(contract.connect(user1).grantRole(MINTER_ROLE, user2.address))
                .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                .withArgs(user1.address, DEFAULT_ADMIN_ROLE);
        });

        it('should reverts if there is already default admin role', async function () {
            await expect(contract.connect(deployer).grantRole(DEFAULT_ADMIN_ROLE, owner1.address)).to.be.revertedWithCustomError(
                contract,
                'AccessControlEnforcedDefaultAdminRules'
            );
        });

        it('accounts can be granted a role multiple times', async function () {
            await contract.connect(deployer).grantRole(ROLE, user3.address);
            const tx = await contract.connect(deployer).grantRole(ROLE, user3.address);
            expect(await tx.wait()).to.not.emit(contract, 'RoleGranted');
        });
    });

    describe('default admin transfer', function () {
        describe('beginDefaultAdminTransfer', function () {
            it('should revert when called by non defaultAdmin', async function () {
                await expect(contract.connect(user1).beginDefaultAdminTransfer(owner1.address)).to.be.revertedWithCustomError(
                    contract,
                    'AccessControlUnauthorizedAccount'
                );
            });
            it('should set pendingDefaultAdmin when called by defaultAdmin', async function () {
                expect(await contract.pendingDefaultAdmin()).to.equal(AddressZero);
                await contract.connect(deployer).beginDefaultAdminTransfer(owner1.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(owner1.address);
            });
        });

        describe('cancelDefaultAdminTransfer', function () {
            it('should revert when called by non defaultAdmin', async function () {
                await expect(contract.connect(user1).cancelDefaultAdminTransfer()).to.be.revertedWithCustomError(
                    contract,
                    'AccessControlUnauthorizedAccount'
                );
            });
            it('should set pendingDefaultAdmin to zero when called by defaultAdmin', async function () {
                await contract.connect(deployer).beginDefaultAdminTransfer(owner1.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(owner1.address);
                await contract.connect(deployer).cancelDefaultAdminTransfer();
                expect(await contract.pendingDefaultAdmin()).to.equal(AddressZero);
            });
        });

        describe('acceptDefaultAdminTransfer', function () {
            beforeEach(async function () {
                expect(await contract.defaultAdmin()).to.equal(deployer.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(AddressZero);
                await contract.connect(deployer).beginDefaultAdminTransfer(owner1.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(owner1.address);
            });
            it('should revert when called by non pendingDefaultAdmin', async function () {
                await expect(contract.connect(user1).acceptDefaultAdminTransfer())
                    .to.be.revertedWithCustomError(contract, 'AccessControlInvalidDefaultAdmin')
                    .withArgs(user1.address);
            });
            it('should set _currentDefaultAdmin to new defaultAdmin & pendingDefaultAdmin to zero when called by new defaultAdmin', async function () {
                expect(await contract.defaultAdmin()).to.equal(deployer.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(owner1.address);
                await expect(contract.connect(owner1).acceptDefaultAdminTransfer())
                    .to.emit(contract, 'RoleGranted')
                    .withArgs(DEFAULT_ADMIN_ROLE, owner1.address, owner1.address);
                expect(await contract.defaultAdmin()).to.equal(owner1.address);
                expect(await contract.pendingDefaultAdmin()).to.equal(AddressZero);
            });
        });
    });
});
