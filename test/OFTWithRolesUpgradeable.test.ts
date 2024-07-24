import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { UPGRADE_ADMIN_ROLE } from './Consts';
import { BigNumber, Contract } from 'ethers';
import { HexTrustUSDV2 } from '../typechain-types';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContractAndUpgradeToV2 } from './Utils';
const { constants } = ethers;
const { One } = constants;

describe('OFTWithRolesUpgradeable', function () {
    let proxy: HexTrustUSDV2;
    let endpoint: Contract;
    let eid;

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
        ({
            proxyV2: proxy,
            eid,
            endpoint,
            deployer,
            owner1,
            minerRoleUser,
            burnerRoleUser,
            pauserRoleUser,
            upgradeAdminRoleUser,
            blacklistRoleUser,
            user1,
            user2,
            user3,
        } = await loadFixture(deployContractAndUpgradeToV2));
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

    describe('isAuthorizedOperator', function () {
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
