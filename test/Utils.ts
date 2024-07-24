import { expect } from 'chai';
import { upgrades, ethers } from 'hardhat';
import { HexTrustUSD } from '../typechain-types';
import { HexTrustUSDV2 } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MINTER_ROLE, BURNER_ROLE, PAUSER_ROLE, BLACKLISTER_ROLE, UPGRADE_ADMIN_ROLE } from './Consts';

export async function deployContractExposed() {
    const signers = await getSigners();
    const contract = await deployProxyForHexTrustUSDV1Default(signers.deployer, true);
    return {
        ...signers,
        contract,
    };
}

export async function deployContract() {
    const signers = await getSigners();
    const contract = await deployProxyForHexTrustUSDV1Default(signers.deployer);
    return {
        ...signers,
        contract,
    };
}

export async function deployContractAndUpgradeToV2() {
    const signers = await getSigners();
    const { deployer } = signers;
    let proxy = await deployProxyForHexTrustUSDV1Default(deployer);
    await grantRoleForAdmins(proxy as HexTrustUSD, deployer);
    await proxy.connect(deployer).grantRole(UPGRADE_ADMIN_ROLE, deployer.address);
    const LZEndpointV2Mock = await ethers.getContractFactory('EndpointV2Mock');
    const eid = 1;
    const endpoint = await LZEndpointV2Mock.deploy(eid, deployer.address);
    const HexTrustUSDV2Contract = await ethers.getContractFactory(`HexTrustUSDV2`, deployer);
    const decimals = await proxy.decimals();
    const delegate = await proxy.defaultAdmin();
    const proxyV2 = await upgrades.upgradeProxy(proxy.address, HexTrustUSDV2Contract, {
        constructorArgs: [decimals, endpoint.address],
        call: {
            fn: 'initializeV2',
            args: [delegate],
        },
    });
    await proxy.revokeRole(UPGRADE_ADMIN_ROLE, deployer.address);
    return {
        ...signers,
        proxy,
        proxyV2: proxyV2 as HexTrustUSDV2,
        eid,
        endpoint,
    };
}

export async function grantRoleForAdmins(contract: HexTrustUSD, defaultAdmin: SignerWithAddress) {
    const { minerRoleUser, burnerRoleUser, pauserRoleUser, upgradeAdminRoleUser, blacklistRoleUser } = await getSigners();
    await contract.connect(defaultAdmin).grantRole(MINTER_ROLE, minerRoleUser.address);
    await contract.connect(defaultAdmin).grantRole(BURNER_ROLE, burnerRoleUser.address);
    await contract.connect(defaultAdmin).grantRole(PAUSER_ROLE, pauserRoleUser.address);
    await contract.connect(defaultAdmin).grantRole(BLACKLISTER_ROLE, blacklistRoleUser.address);
    await contract.connect(defaultAdmin).grantRole(UPGRADE_ADMIN_ROLE, upgradeAdminRoleUser.address);
}

export async function getSigners() {
    let [deployer, owner1, minerRoleUser, burnerRoleUser, pauserRoleUser, upgradeAdminRoleUser, blacklistRoleUser, user1, user2, user3, ...accounts] =
        await ethers.getSigners();
    return {
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
        accounts,
    };
}

export async function deployProxyForHexTrustUSDV1Default(deployer: SignerWithAddress, isExposed: boolean = false) {
    const decimals = 6;
    const symbol = 'USDX';
    const name = 'Hex Trust USD';
    return deployProxyForHexTrustUSDV1(deployer, name, symbol, decimals, isExposed);
}

export async function deployProxyForHexTrustUSDV1(
    deployer: SignerWithAddress,
    name: string,
    symbol: string,
    decimals: number,
    isExposed: boolean = false
) {
    const HexTrustUSDContract = await ethers.getContractFactory(`${isExposed ? '$' : ''}HexTrustUSD`, deployer);
    let contract = await upgrades.deployProxy(HexTrustUSDContract, [deployer.address, name, symbol, decimals], {
        initializer: 'initialize',
        kind: 'uups',
    });
    return contract;
}

export async function validateERC20(proxy: HexTrustUSD | HexTrustUSDV2) {
    const decimals = 6;
    const symbol = 'USDX';
    const name = 'Hex Trust USD';
    expect(await proxy.decimals()).to.equal(decimals);
    expect(await proxy.name()).to.equal(name);
    expect(await proxy.symbol()).to.equal(symbol);
}
