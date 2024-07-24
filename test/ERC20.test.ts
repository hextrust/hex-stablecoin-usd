import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployContractExposed, grantRoleForAdmins } from './Utils';
import { BigNumber } from 'ethers';
import { BLACKLISTER_ROLE, BURNER_ROLE, MINTER_ROLE } from './Consts';

const { constants, utils } = ethers;
const { Zero, One, AddressZero } = constants;
let contract: any;
let decimals: number;
let amount: BigNumber;
let deployer: SignerWithAddress,
    minerRoleUser: SignerWithAddress,
    burnerRoleUser: SignerWithAddress,
    blacklistRoleUser: SignerWithAddress,
    pauserRoleUser: SignerWithAddress,
    user: SignerWithAddress,
    spender: SignerWithAddress,
    blacklistedUser: SignerWithAddress;

describe('ERC20Test', function () {
    beforeEach(async function () {
        ({
            contract,
            deployer,
            minerRoleUser,
            burnerRoleUser,
            blacklistRoleUser,
            pauserRoleUser,
            user1: user,
            user2: spender,
            user3: blacklistedUser,
        } = await loadFixture(deployContractExposed));
        await grantRoleForAdmins(contract, deployer);
        await contract.connect(blacklistRoleUser).addBlacklist(blacklistedUser.address);
        decimals = await contract.decimals();
        amount = utils.parseUnits('100', decimals);
    });

    describe('mint', function () {
        it('should revert with zero amount', async function () {
            await expect(contract.connect(minerRoleUser).mint(minerRoleUser.address, 0)).to.be.reverted;
        });

        it('should revert when mint to blacklisted address', async function () {
            await expect(contract.connect(minerRoleUser).mint(blacklistedUser.address, amount))
                .to.be.revertedWithCustomError(contract, 'AlreadyBlacklisted')
                .withArgs(blacklistedUser.address);
        });

        it('should success to mint tokens to target address and update balance', async function () {
            expect(await contract.balanceOf(user.address)).to.be.equal(0);
            await expect(contract.connect(minerRoleUser).mint(user.address, amount))
                .to.changeTokenBalances(contract, [user.address], [amount])
                .to.emit(contract, 'Transfer')
                .withArgs(AddressZero, user.address, amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(amount);
        });

        it('should success to mint tokens to minerRoleUser address and update balance', async function () {
            expect(await contract.balanceOf(minerRoleUser.address)).to.be.equal(0);
            await expect(contract.connect(minerRoleUser).mint(minerRoleUser.address, amount))
                .to.changeTokenBalances(contract, [minerRoleUser.address], [amount])
                .to.emit(contract, 'Transfer')
                .withArgs(AddressZero, minerRoleUser.address, amount);
            expect(await contract.balanceOf(minerRoleUser.address)).to.be.equal(amount);
        });

        it('should revert when caller without MINTER_ROLE', async function () {
            for (const caller of [deployer, user, burnerRoleUser, blacklistRoleUser]) {
                await expect(contract.connect(caller).mint(user.address, amount))
                    .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                    .withArgs(caller.address, MINTER_ROLE);
            }
        });
    });

    describe('burn', function () {
        it('should revert with null account / zero address', async function () {
            await expect(contract.connect(burnerRoleUser).$_burn(AddressZero, 1n))
                .to.be.revertedWithCustomError(contract, 'ERC20InvalidSender')
                .withArgs(AddressZero);
        });

        it('should revert when caller without BURNER_ROLE', async function () {
            for (const caller of [deployer, user, minerRoleUser, blacklistRoleUser]) {
                await expect(contract.connect(caller).burn(amount))
                    .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                    .withArgs(caller.address, BURNER_ROLE);
            }
        });

        it('should revert with zero amount', async function () {
            await expect(contract.connect(burnerRoleUser).burn(0)).to.be.revertedWithCustomError(contract, 'ZeroValue');
        });

        it('should success to burn tokens from burner balance', async function () {
            const mintAmount = utils.parseUnits('10000', decimals);
            const burnAmount = utils.parseUnits('99', decimals);
            await contract.connect(minerRoleUser).mint(burnerRoleUser.address, mintAmount);
            const preTotalSupply = BigNumber.from(await contract.totalSupply());
            await expect(contract.connect(burnerRoleUser).burn(burnAmount))
                .to.changeTokenBalances(contract, [burnerRoleUser.address], [Zero.sub(burnAmount)])
                .to.emit(contract, 'Transfer')
                .withArgs(burnerRoleUser.address, AddressZero, burnAmount);
            expect(await contract.totalSupply()).to.be.equal(preTotalSupply.sub(burnAmount));
            expect(await contract.balanceOf(burnerRoleUser.address)).to.be.equal(mintAmount.sub(burnAmount));
        });

        it('should revert when the given value is greater than the balance of the sender', async function () {
            const mintAmount = utils.parseUnits('99', decimals);
            const burnAmount = utils.parseUnits('100', decimals);
            await contract.connect(minerRoleUser).mint(burnerRoleUser.address, mintAmount);
            await expect(contract.connect(burnerRoleUser).burn(burnAmount)).to.be.revertedWithCustomError(contract, 'ERC20InsufficientBalance');
        });
    });

    describe('approve / allowance', function () {
        it('should emits an approval event when the spender is not the zero address', async function () {
            await expect(await contract.connect(user).approve(spender.address, amount))
                .to.emit(contract, 'Approval')
                .withArgs(user.address, spender.address, amount);
            expect(await contract.allowance(user.address, spender.address)).to.be.equal(amount);
        });

        it('should approves the requested value and replaces the previous one', async function () {
            await contract.connect(user).approve(spender.address, amount);
            const newValue = utils.parseUnits('6', decimals);
            await contract.connect(user).approve(spender.address, newValue);
            expect(await contract.allowance(user.address, spender.address)).to.be.equal(newValue);
        });

        it('should revert when the spender is the zero address', async function () {
            expect(contract.connect(user).approve(contract.AddressZero, amount)).to.be.reverted;
        });

        it('should success when paused', async function () {
            await contract.connect(pauserRoleUser).pause();
            await expect(await contract.connect(user).approve(spender.address, amount))
                .to.emit(contract, 'Approval')
                .withArgs(user.address, spender.address, amount);
        });
    });

    describe('whenNotPaused', function () {
        it('should reverts when trying to transfer when paused', async function () {
            await contract.connect(minerRoleUser).mint(user.address, amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(amount);

            await contract.connect(user).transfer(burnerRoleUser.address, amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(0);
            expect(await contract.balanceOf(burnerRoleUser.address)).to.be.equal(amount);

            await contract.connect(burnerRoleUser).burn(amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(0);

            await contract.connect(pauserRoleUser).pause();

            await expect(contract.connect(minerRoleUser).mint(user.address, amount)).to.be.revertedWithCustomError(contract, 'EnforcedPause');
            await expect(contract.connect(user).transfer(burnerRoleUser.address, amount)).to.be.revertedWithCustomError(contract, 'EnforcedPause');
            await expect(contract.connect(burnerRoleUser).burn(amount)).to.be.revertedWithCustomError(contract, 'EnforcedPause');
        });
    });

    describe('transferFrom', function () {
        let allowance: BigNumber;
        let mintAmount: BigNumber;
        beforeEach(async function () {
            allowance = amount.mul(2);
            mintAmount = amount.mul(4);
            await contract.connect(user).approve(spender.address, allowance);
            await contract.connect(minerRoleUser).mint(user.address, mintAmount);
        });

        it('should allows spender to transfer balance from user to spender address when not paused', async function () {
            await expect(contract.connect(spender).transferFrom(user.address, spender.address, amount))
                .to.emit(contract, 'Transfer')
                .withArgs(user.address, spender.address, amount);
            expect(await contract.balanceOf(spender.address)).to.be.equal(amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(mintAmount.sub(amount));
        });

        it('allows to transfer when paused and then unpaused', async function () {
            await contract.connect(pauserRoleUser).pause();
            await contract.connect(pauserRoleUser).unpause();

            await expect(contract.connect(spender).transferFrom(user.address, spender.address, amount))
                .to.emit(contract, 'Transfer')
                .withArgs(user.address, spender.address, amount);
            expect(await contract.balanceOf(spender.address)).to.be.equal(amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(mintAmount.sub(amount));
        });

        it('reverts when trying to transfer from when paused', async function () {
            await contract.connect(pauserRoleUser).pause();
            await expect(contract.connect(spender).transferFrom(user.address, spender.address, amount)).to.be.revertedWithCustomError(
                contract,
                'EnforcedPause'
            );
        });
    });

    describe('totalSupply', function () {
        it('returns the total token value', async function () {
            expect(await contract.totalSupply()).to.be.equal(Zero);
            await contract.connect(minerRoleUser).mint(burnerRoleUser.address, amount);
            expect(await contract.totalSupply()).to.be.equal(amount);
            await contract.connect(burnerRoleUser).burn(One);
            expect(await contract.totalSupply()).to.be.equal(amount.sub(One));
        });
    });

    describe('transfer', function () {
        let mintAmount: BigNumber;
        beforeEach(async function () {
            mintAmount = amount.mul(4);
            await contract.connect(minerRoleUser).mint(user.address, mintAmount);
        });

        it('should success & emits a Transfer event when the sender transfers less than balance', async function () {
            expect(await contract.connect(user).transfer(spender.address, amount))
                .to.emit(contract, 'Transfer')
                .withArgs(user.address, spender.address, amount);
            expect(await contract.balanceOf(user.address)).to.be.equal(mintAmount.sub(amount));
            expect(await contract.balanceOf(spender.address)).to.be.equal(amount);
        });

        it('should success & emits a Transfer event when the sender transfers all balance', async function () {
            const allBalance = await contract.balanceOf(user.address);
            expect(await contract.connect(user).transfer(spender.address, allBalance))
                .to.emit(contract, 'Transfer')
                .withArgs(user.address, spender.address, allBalance);
            expect(await contract.balanceOf(user.address)).to.be.equal(Zero);
            expect(await contract.balanceOf(spender.address)).to.be.equal(allBalance);
        });

        it('should revert when transfer amount greater than balance', async function () {
            const allBalance = await contract.balanceOf(user.address);
            expect(contract.connect(user).transfer(spender, amount.add(One)))
                .to.be.revertedWithCustomError(contract, 'ERC20InsufficientBalance')
                .withArgs(user.address, allBalance, amount.add(One));
        });

        it('should success & emits a Transfer event when the sender transfers zero tokens', async function () {
            expect(await contract.connect(user).transfer(spender.address, Zero))
                .to.emit(contract, 'Transfer')
                .withArgs(user.address, spender.address, Zero);
            expect(await contract.balanceOf(user.address)).to.be.equal(mintAmount);
            expect(await contract.balanceOf(spender.address)).to.be.equal(Zero);
        });

        it('should revert when transfer from blacklisted address', async function () {
            expect(contract.connect(blacklistRoleUser).transfer(user, amount))
                .to.be.revertedWithCustomError(contract, 'AlreadyBlacklisted')
                .withArgs(blacklistRoleUser.address);
        });

        it('should revert when transfer to blacklisted address', async function () {
            expect(contract.connect(user).transfer(blacklistRoleUser, amount))
                .to.be.revertedWithCustomError(contract, 'AlreadyBlacklisted')
                .withArgs(blacklistRoleUser.address);
        });

        it('should revert when transfer to zero address', async function () {
            expect(contract.connect(user).transfer(AddressZero, amount))
                .to.be.revertedWithCustomError(contract, 'ERC20InvalidReceiver')
                .withArgs(AddressZero);
        });
    });

    describe('Burn Black Funds', function () {
        let blacklistedUserBalance: BigNumber;
        beforeEach(async function () {
            blacklistedUserBalance = utils.parseUnits('5000', decimals);
            await contract.connect(blacklistRoleUser).removeBlacklist(blacklistedUser.address);
            await contract.connect(minerRoleUser).mint(blacklistedUser.address, blacklistedUserBalance);
            await contract.connect(blacklistRoleUser).addBlacklist(blacklistedUser.address);
        });

        it('should burn all balance of blacklisted user when caller has BLACKLISTER_ROLE', async function () {
            expect(await contract.balanceOf(blacklistedUser.address)).to.equal(blacklistedUserBalance);
            await contract.connect(blacklistRoleUser).burnBlackFunds(blacklistedUser.address);
            expect(await contract.balanceOf(blacklistedUser.address)).to.equal(Zero);
        });

        it('should revert when input a non-blacklisted account when caller has BLACKLISTER_ROLE', async function () {
            await expect(contract.connect(blacklistRoleUser).burnBlackFunds(user.address))
                .to.be.revertedWithCustomError(contract, 'NotBlacklisted')
                .withArgs(user.address);
        });

        it('should revert when input a blacklisted account when caller do not have BLACKLISTER_ROLE', async function () {
            for (const caller of [deployer, user, minerRoleUser, burnerRoleUser]) {
                await expect(contract.connect(caller).burnBlackFunds(blacklistedUser.address))
                    .to.be.revertedWithCustomError(contract, 'AccessControlUnauthorizedAccount')
                    .withArgs(caller.address, BLACKLISTER_ROLE);
            }
        });
    });
});
