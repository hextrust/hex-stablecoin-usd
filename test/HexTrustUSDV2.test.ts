import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { UPGRADE_ADMIN_ROLE } from './Consts';
import { BigNumber, Contract } from 'ethers';
import { HexTrustUSDV2 } from '../typechain-types';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContractAndUpgradeToV2, validateERC20 } from './Utils';
const { constants } = ethers;
const { One } = constants;

describe('HexTrustUSDV2', function () {
    let proxy: HexTrustUSDV2;
    let endpoint: Contract;
    let eid: number;

    let deployer: SignerWithAddress,
        owner1: SignerWithAddress,
        pauserRoleUser: SignerWithAddress,
        upgradeAdminRoleUser: SignerWithAddress,
        user1: SignerWithAddress;

    beforeEach(async function () {
        ({
            proxyV2: proxy,
            eid,
            endpoint,
            deployer,
            owner1,
            upgradeAdminRoleUser,
            pauserRoleUser,
            user1,
        } = await loadFixture(deployContractAndUpgradeToV2));
    });

    describe('initializeV2', function () {
        it('should revert if calling initialize again', async function () {
            await expect(proxy.initializeV2()).to.be.revertedWithCustomError(proxy, 'InvalidInitialization');
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

    describe('endpointDelegate', function () {
        it('should return delegate in endpoint & equals defaultAdmin', async function () {
            expect(await proxy.endpointDelegate()).to.equals(deployer.address);
            expect(await proxy.endpointDelegate()).to.equals(await proxy.defaultAdmin());
        });
        it('should return delegate in endpoint not update after transfer defaultAdmin', async function () {
            expect(await proxy.endpointDelegate()).to.equals(deployer.address);
            expect(await proxy.endpointDelegate()).to.equals(await proxy.defaultAdmin());
            await proxy.connect(deployer).beginDefaultAdminTransfer(owner1.address);
            await proxy.connect(owner1).acceptDefaultAdminTransfer();
            expect(await proxy.endpointDelegate()).to.equals(deployer.address);
            expect(await proxy.endpointDelegate()).to.not.equals(await proxy.defaultAdmin());
        });
    });

    describe('setEndpointDelegate', function () {
        it('should return only allow called by user whitelisted in isAuthorizedOperator()', async function () {
            expect(await proxy.endpointDelegate()).to.equals(deployer.address);
            expect(await proxy.endpointDelegate()).to.equals(await proxy.defaultAdmin());
            await proxy.connect(deployer).setEndpointDelegate(owner1.address);
            expect(await proxy.endpointDelegate()).to.equals(owner1.address);
            await proxy.connect(upgradeAdminRoleUser).setEndpointDelegate(user1.address);
            expect(await proxy.endpointDelegate()).to.equals(user1.address);
        });
    });
    describe('oAppVersion', function () {
        it('should return interfaceId and version 1', async function () {
            const { senderVersion, receiverVersion } = await proxy.oAppVersion();
            expect(senderVersion).to.equals(One);
            expect(receiverVersion).to.equals(One);
        });
    });

    describe('token', function () {
        it('should return the proxy contract address itself', async function () {
            expect(await proxy.token()).to.equals(proxy.address);
        });
    });

    describe('approvalRequired', function () {
        it('should return false', async function () {
            expect(await proxy.approvalRequired()).to.be.false;
        });
    });

    describe('isAuthorizedOperator & setEndpointDelegate', function () {
        it('should return false for nonDefaultAdmin & without UPGRADE_ADMIN_ROLE', async function () {
            expect(await proxy.isAuthorizedOperator(user1.address)).to.be.false;
        });
        it('should return true for defaultAdmin', async function () {
            expect(await proxy.isAuthorizedOperator(await proxy.defaultAdmin())).to.be.true;
            expect(await proxy.isAuthorizedOperator(await proxy.owner())).to.be.true;
            expect(await proxy.isAuthorizedOperator(deployer.address)).to.be.true;
            await proxy.connect(deployer).beginDefaultAdminTransfer(owner1.address);
            await proxy.connect(owner1).acceptDefaultAdminTransfer();
            expect(await proxy.defaultAdmin()).to.equals(owner1.address);
            expect(await proxy.isAuthorizedOperator(deployer.address)).to.be.false;
            expect(await proxy.isAuthorizedOperator(owner1.address)).to.be.true;
            await expect(proxy.connect(deployer).setEndpointDelegate(deployer.address)).to.be.revertedWithCustomError(proxy, 'NonAuthorizeOperator');
            await expect(proxy.connect(deployer).setEndpointDelegate(owner1.address)).to.be.revertedWithCustomError(proxy, 'NonAuthorizeOperator');
            expect(await proxy.endpointDelegate()).to.be.equals(deployer.address);
            await proxy.connect(owner1).setEndpointDelegate(owner1.address);
            await expect(proxy.connect(owner1).setEndpointDelegate(owner1.address));
            expect(await proxy.endpointDelegate()).to.be.equals(owner1.address);
        });
        it('should return true for user with UPGRADE_ADMIN_ROLE', async function () {
            expect(await proxy.isAuthorizedOperator(upgradeAdminRoleUser.address)).to.be.true;
            await proxy.revokeRole(UPGRADE_ADMIN_ROLE, upgradeAdminRoleUser.address);
            expect(await proxy.hasRole(UPGRADE_ADMIN_ROLE, upgradeAdminRoleUser.address)).to.be.false;
            expect(await proxy.isAuthorizedOperator(upgradeAdminRoleUser.address)).to.be.false;
            expect(await proxy.isAuthorizedOperator(user1.address)).to.be.false;
            await proxy.grantRole(UPGRADE_ADMIN_ROLE, user1.address);
            expect(await proxy.isAuthorizedOperator(user1.address)).to.be.true;
        });
    });

    describe('endpoint', function () {
        it('should return endpoint address', async function () {
            expect(await proxy.endpoint()).to.equals(endpoint.address);
        });
    });

    describe('decimalConversionRate', function () {
        it('should return 1', async function () {
            expect(await proxy.decimalConversionRate()).to.equals(One);
        });
    });

    describe('sharedDecimals', function () {
        it('should return 6', async function () {
            expect(await proxy.sharedDecimals()).to.equals(BigNumber.from(6));
            expect(await proxy.sharedDecimals()).to.equals(await proxy.decimals());
        });
    });
});
