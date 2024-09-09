import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployContractExposed } from "./Utils"
import { ethers, web3 } from 'hardhat';
import { DEFAULT_ADMIN_ROLE } from './Consts';

/**
 * fork from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/access/AccessControl.behavior.js
 */

const ROLE = web3.utils.soliditySha3('ROLE');
const OTHER_ROLE = web3.utils.soliditySha3('OTHER_ROLE');
let contract: any;
let owner: SignerWithAddress, user: SignerWithAddress, authorized: SignerWithAddress, otherOwner: SignerWithAddress;

describe('AccessControlTest', function () {
    beforeEach(async function () {
        ({ contract, deployer: owner, user1: user, user3: authorized, owner1: otherOwner } = await loadFixture(deployContractExposed));
    });

    describe('renouncing', function () {
        it('roles that are not had can be renounced', async function () {
            await expect(contract.connect(authorized).renounceRole(ROLE, authorized.address)).to.not.emit(contract, "RoleRevoked");
        })

        it('bearer can renounce role', async function () {
            await contract.connect(owner).grantRole(ROLE, authorized.address);
            await expect(contract.connect(authorized).renounceRole(ROLE, authorized.address))
                .to.emit(contract, 'RoleRevoked')
                .withArgs(ROLE, authorized.address, authorized.address);

            expect(await contract.hasRole(ROLE, authorized.address)).to.equal(false);
        });

        it('only the sender can renounce their roles', async function () {
            expect(contract.connect(owner).renounceRole(ROLE, authorized.address)).to.be.revertedWithCustomError(
                contract,
                'AccessControlBadConfirmation',
            );
        });

        it('a role can be renounced multiple times', async function () {
            await contract.connect(authorized).renounceRole(ROLE, authorized.address);

            await expect(contract.connect(authorized).renounceRole(ROLE, authorized.address)).not.to.emit(
                contract,
                'RoleRevoked',
            );
        });
    })

    describe('revoking', function () {
        it('roles that are not had can be revoked', async function () {
            expect(await contract.hasRole(ROLE, authorized.address)).to.equal(false);
            const tx = await contract.connect(owner).revokeRole(ROLE, authorized.address);
            expect(await tx.wait()).to.not.emit(contract, "RoleRevoked");
        });
        context('with granted role', function () {
            beforeEach(async function () {
                await contract.connect(owner).grantRole(ROLE, authorized.address);
            });

            it('owner can revoke role', async function () {
                const tx = await contract.connect(owner).revokeRole(ROLE, authorized.address);
                expect(await tx.wait()).to.emit(contract, "RoleRevoked");
                expect(await contract.hasRole(ROLE, authorized.address)).to.equal(false);
            });

            it('non-owner cannot revoke role', async function () {
                await expect(contract.connect(user).revokeRole(ROLE, authorized.address)).to.be.reverted;
            });

            it('a role can be revoked multiple times', async function () {
                await contract.connect(owner).revokeRole(ROLE, authorized.address);
                const tx = await contract.connect(owner).revokeRole(ROLE, authorized.address);
                expect(await tx.wait()).to.not.emit(contract, "RoleRevoked");
            });
        });
    });

    describe('default admin', function () {

        it('should revert if granting default admin role', async function () {
            await expect(
                contract.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, owner.address),
            ).to.be.revertedWithCustomError(contract, 'AccessControlEnforcedDefaultAdminRules');
        });

        it('should revert if revoking default admin role', async function () {
            await expect(
                contract.connect(owner).revokeRole(DEFAULT_ADMIN_ROLE, owner.address),
            ).to.be.revertedWithCustomError(contract, 'AccessControlEnforcedDefaultAdminRules');
        });

        it("should revert if defaultAdmin's admin is changed", async function () {
            await expect(contract.$_setRoleAdmin(DEFAULT_ADMIN_ROLE, OTHER_ROLE)).to.be.revertedWithCustomError(
                contract,
                'AccessControlEnforcedDefaultAdminRules',
            );
        });
    });

    describe('setting role owner', function () {
        beforeEach(async function () {
            await contract.connect(owner).$_setRoleAdmin(ROLE, OTHER_ROLE);
            await contract.connect(owner).grantRole(OTHER_ROLE, otherOwner.address);
        });

        it("reverts when setting owner for default admin role", async function () {
            await expect(contract.connect(owner).$_setRoleAdmin(DEFAULT_ADMIN_ROLE, OTHER_ROLE)).to.revertedWithCustomError(contract, "AccessControlEnforcedDefaultAdminRules")
        });

        it("a role's owner role can be changed", async function () {
            expect(await contract.getRoleAdmin(ROLE)).to.equal(OTHER_ROLE);
        });

        it('the new owner can grant roles', async function () {
            const tx = await contract.connect(otherOwner).grantRole(ROLE, authorized.address);
            expect(await tx.wait()).to.emit(contract, "RoleGranted");
        });

        it('the new owner can revoke roles', async function () {
            await contract.connect(otherOwner).grantRole(ROLE, authorized.address);
            const tx = await contract.connect(otherOwner).revokeRole(ROLE, authorized.address);
            expect(await tx.wait()).to.emit(contract, "RoleRevoked");
        });

        it("a role's previous owner no longer grant roles", async function () {
            await expect(contract.connect(owner).grantRole(ROLE, authorized.address)).to.be.reverted;
        });

        it("a role's previous owner no longer revoke roles", async function () {
            await expect(contract.connect(owner).revokeRole(ROLE, authorized.address)).to.be.reverted;
        });
    });
})

