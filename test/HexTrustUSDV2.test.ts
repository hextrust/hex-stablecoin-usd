import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { UPGRADE_ADMIN_ROLE } from './Consts';
import { Contract } from 'ethers';
import { HexTrustUSDV2 } from '../typechain-types';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContractAndUpgradeToV2, validateERC20 } from './Utils';

describe('HexTrustUSDV2', function () {
    let proxy: HexTrustUSDV2;
    let endpoint: Contract;
    let eid: number;

    let deployer: SignerWithAddress, pauserRoleUser: SignerWithAddress, upgradeAdminRoleUser: SignerWithAddress;

    beforeEach(async function () {
        ({ proxyV2: proxy, eid, endpoint, deployer, upgradeAdminRoleUser, pauserRoleUser } = await loadFixture(deployContractAndUpgradeToV2));
    });

    describe('initializeV2', function () {
        it('should revert if calling initialize again', async function () {
            await expect(proxy.initializeV2(deployer.address)).to.be.revertedWithCustomError(proxy, 'InvalidInitialization');
        });
    });

    describe('upgrade', function () {
        let newImplementation: Contract;
        let endpoint2: Contract;
        beforeEach(async function () {
            const LZEndpointV2Mock = await ethers.getContractFactory('EndpointV2Mock');
            endpoint2 = await LZEndpointV2Mock.deploy(eid, deployer.address);
            const decimals = await proxy.decimals();
            newImplementation = await ethers.deployContract('HexTrustUSDV2', [decimals, endpoint2.address]);
        });

        afterEach(async function () {
            await validateERC20(proxy);
            expect(await proxy.owner()).to.equal(deployer.address);
            expect(await proxy.defaultAdmin()).to.equal(deployer.address);
            expect(await proxy.getVersion()).to.equal(2);
        });

        it('should success when not paused & called by user with UPGRADE_ADMIN_ROLE', async function () {
            await expect(proxy.connect(upgradeAdminRoleUser).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
        });
        it('should success when paused & called by user with UPGRADE_ADMIN_ROLE', async function () {
            await proxy.connect(pauserRoleUser).pause();
            await expect(proxy.connect(upgradeAdminRoleUser).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
        });
        it('should success for defaultAdmin without UPGRADE_ADMIN_ROLE', async function () {
            expect(await proxy.hasRole(UPGRADE_ADMIN_ROLE, deployer.address)).to.be.false;
            await expect(proxy.connect(deployer).upgradeToAndCall(newImplementation.address, '0x'))
                .to.emit(proxy, 'Upgraded')
                .withArgs(newImplementation.address);
            expect(await proxy.approvalRequired()).to.be.false;
            expect(await proxy.endpoint()).to.equal(endpoint2.address);
        });
    });

    describe('endpoint', function () {
        it('should return endpoint address', async function () {
            expect(await proxy.endpoint()).to.equals(endpoint.address);
        });
    });
});
