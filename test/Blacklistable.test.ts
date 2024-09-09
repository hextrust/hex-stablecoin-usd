import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployContract, grantRoleForAdmins } from './Utils';
import { BLACKLISTER_ROLE } from './Consts';

const { constants } = ethers;
let contract: any;
let deployer: SignerWithAddress,
    blacklistRoleUser: SignerWithAddress,
    minerRoleUser: SignerWithAddress,
    user: SignerWithAddress,
    anotherUser: SignerWithAddress;

describe('BlacklistableTest', function () {
    beforeEach(async function () {
        ({ contract, deployer, blacklistRoleUser, user1: user, user2: anotherUser, minerRoleUser } = await loadFixture(deployContract));
        await grantRoleForAdmins(contract, deployer);
    });

    describe('removeBlacklist', function () {
        beforeEach(async function () {
            await contract.connect(blacklistRoleUser).addBlacklist(user.address);
        });

        it('should revert when called by non BLACKLISTER_ROLE user', async function () {
            await expect(contract.connect(anotherUser).removeBlacklist(user.address))
                .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                .withArgs(anotherUser.address, BLACKLISTER_ROLE);
        });

        it('should revert with zero address', async function () {
            await expect(contract.connect(blacklistRoleUser).removeBlacklist(constants.AddressZero)).to.be.revertedWithCustomError(
                contract,
                'ZeroAddress'
            );
        });

        it('should revert with non blacklisted user', async function () {
            expect(await contract.isBlacklisted(anotherUser.address)).to.be.false;
            await expect(contract.connect(blacklistRoleUser).removeBlacklist(anotherUser.address)).to.be.revertedWithCustomError(
                contract,
                'NotBlacklisted'
            );
        });

        it('should emit an event when a user is removed from the blacklist', async function () {
            expect(await contract.isBlacklisted(user.address)).to.be.true;
            await expect(contract.connect(blacklistRoleUser).removeBlacklist(user.address))
                .to.emit(contract, 'RemovedBlacklist')
                .withArgs(user.address);
            expect(await contract.isBlacklisted(user.address)).to.be.false;
        });
    });

    describe('addBlacklist', function () {
        it('should revert when called by non BLACKLISTER_ROLE user', async function () {
            await expect(contract.connect(anotherUser).addBlacklist(user.address))
                .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                .withArgs(anotherUser.address, BLACKLISTER_ROLE);
        });

        it('should revert when blacklist zero address', async function () {
            await expect(contract.connect(blacklistRoleUser).addBlacklist(constants.AddressZero)).to.be.revertedWithCustomError(
                contract,
                'ZeroAddress'
            );
        });

        it('should revert when blacklist already blacklisted user', async function () {
            expect(await contract.isBlacklisted(user.address)).to.be.false;
            await contract.connect(blacklistRoleUser).addBlacklist(user.address);
            expect(await contract.isBlacklisted(user.address)).to.be.true;
            await expect(contract.connect(blacklistRoleUser).addBlacklist(user.address)).to.be.revertedWithCustomError(
                contract,
                'AlreadyBlacklisted'
            );
        });

        it('should emit an event when a user is added to the blacklist', async function () {
            expect(await contract.isBlacklisted(user.address)).to.be.false;
            await expect(contract.connect(blacklistRoleUser).addBlacklist(user.address)).to.emit(contract, 'AddedBlacklist').withArgs(user.address);
            expect(await contract.isBlacklisted(user.address)).to.be.true;
        });

        it('should revert when blacklist the contract itself address', async function () {
            await expect(contract.connect(blacklistRoleUser).addBlacklist(contract.address)).to.be.revertedWithCustomError(
                contract,
                'NotBlacklistThisContract'
            );
        });

        it('should revert when blacklist defaultAdmin', async function () {
            await expect(contract.connect(blacklistRoleUser).addBlacklist(contract.defaultAdmin())).to.be.revertedWithCustomError(
                contract,
                'BlacklistNotAllowed'
            );
        });

        it('should revert when blacklist defaultAdmin', async function () {
            await expect(contract.connect(blacklistRoleUser).addBlacklist(blacklistRoleUser.address)).to.be.revertedWithCustomError(
                contract,
                'BlacklistNotAllowed'
            );
        });

        it('should success when blacklist other admin role user', async function () {
            expect(await contract.isBlacklisted(minerRoleUser.address)).to.be.false;
            await expect(contract.connect(blacklistRoleUser).addBlacklist(minerRoleUser.address))
                .to.emit(contract, 'AddedBlacklist')
                .withArgs(minerRoleUser.address);
            expect(await contract.isBlacklisted(minerRoleUser.address)).to.be.true;
        });
    });
});
