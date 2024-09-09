import { ethers, upgrades } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployContract, grantRoleForAdmins, validateERC20 } from './Utils';
import { DEFAULT_ADMIN_ROLE, UPGRADE_ADMIN_ROLE } from './Consts';
import { constants, Contract } from 'ethers';
import { HexTrustUSD } from '../typechain-types';

let proxy: HexTrustUSD;
let newImplementation: Contract;
let deployer: SignerWithAddress, upgradeAdminRoleUser: SignerWithAddress, pauserRoleUser: SignerWithAddress;

describe('HexTrustUSD', function () {
    const decimals = 6;
    const symbol = 'USDX';
    const name = 'Hex Trust USD';

    beforeEach(async function () {
        let contract;
        ({ contract, deployer, upgradeAdminRoleUser, pauserRoleUser } = await loadFixture(deployContract));
        proxy = contract as HexTrustUSD;
        await grantRoleForAdmins(proxy, deployer);
        newImplementation = await ethers.deployContract('HexTrustUSD');
    });

    describe('initialize', function () {
        it('Should fail to initialize with zero address admin', async function () {
            const HexTrustUSDproxy = await ethers.getContractFactory('HexTrustUSD');
            await expect(
                upgrades.deployProxy(HexTrustUSDproxy, [constants.AddressZero, name, symbol, decimals], {
                    initializer: 'initialize',
                    kind: 'uups',
                })
            ).to.be.revertedWithCustomError(HexTrustUSDproxy, 'ZeroAddress');
        });

        it('Should set props through initializer', async function () {
            await validateERC20(proxy);
            expect(await proxy.owner()).to.equal(deployer.address);
            expect(await proxy.getVersion()).to.equal(1);
            expect(await proxy.defaultAdmin()).to.equal(deployer.address);
        });

        it('should set role admin of UPGRADE_ADMIN_ROLE as DEFAULT_ADMIN_ROLE during initialization', async function () {
            const roleAdmin = await proxy.getRoleAdmin(UPGRADE_ADMIN_ROLE);
            expect(roleAdmin).to.equal(DEFAULT_ADMIN_ROLE);
        });

        it('should revert if calling initialize again', async function () {
            await expect(proxy.initialize(deployer.address, name, symbol, decimals)).to.be.revertedWithCustomError(
                proxy,
                'InvalidInitialization'
            );
        });
    });

    describe('upgrade', function () {

        afterEach(async function () {
            await validateERC20(proxy);
            expect(await proxy.owner()).to.equal(deployer.address);
            expect(await proxy.defaultAdmin()).to.equal(deployer.address);
            expect(await proxy.getVersion()).to.equal(1);
        });
    
        it('should success when not paused & called by user with UPGRADE_ADMIN_ROLE', async function () {
            await expect(proxy.connect(upgradeAdminRoleUser).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
        });
        it('should revert when paused & called by user with UPGRADE_ADMIN_ROLE', async function () {
            await proxy.connect(pauserRoleUser).pause();
            await expect(proxy.connect(upgradeAdminRoleUser).upgradeToAndCall(newImplementation.address, '0x')).to.be.revertedWithCustomError(
                proxy,
                'EnforcedPause'
            );
            await proxy.connect(pauserRoleUser).unpause();
            await expect(proxy.connect(upgradeAdminRoleUser).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
        });
        it('should revert for defaultAdmin before grant with UPGRADE_ADMIN_ROLE', async function () {
            await expect(proxy.connect(deployer).upgradeToAndCall(newImplementation.address, '0x'))
                .to.be.revertedWithCustomError(proxy, 'AccessControlUnauthorizedAccount')
                .withArgs(deployer.address, UPGRADE_ADMIN_ROLE);

            await proxy.connect(deployer).grantRole(UPGRADE_ADMIN_ROLE, deployer.address);
            
            await expect(proxy.connect(deployer).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
        });
    });
});
