import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployContract, grantRoleForAdmins } from "./Utils";
import { PAUSER_ROLE } from "./Consts";

let contract: any;
let deployer: SignerWithAddress, pauserRoleUser: SignerWithAddress, user: SignerWithAddress;

describe("PausableWithRolesUpgradeable", function () {
    beforeEach(async function () {
        ({ contract, deployer, pauserRoleUser, user1: user } = await loadFixture(deployContract));
        await grantRoleForAdmins(contract, deployer);
    });

    describe("when caller without PAUSER_ROLE", function () {
        describe("pause", function () {
            it("should revert when caller without PAUSER_ROLE", async function () {
                await expect(contract.connect(deployer).pause())
                    .to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
                    .withArgs(deployer.address, PAUSER_ROLE);
                await expect(contract.connect(user).pause())
                    .to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
                    .withArgs(user.address, PAUSER_ROLE);
            });
        });
        describe("unpause", function () {
            it("should revert when caller without PAUSER_ROLE", async function () {
                await expect(contract.connect(deployer).unpause())
                    .to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
                    .withArgs(deployer.address, PAUSER_ROLE);
                await expect(contract.connect(user).unpause())
                    .to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
                    .withArgs(user.address, PAUSER_ROLE);
            });
        });
    });

    describe("when caller with PAUSER_ROLE", function () {
        beforeEach(async function () {
            await grantRoleForAdmins(contract, deployer);
        });

        describe("pause", function () {
            it("should emit a Paused event", async function () {
                const tx = await contract.connect(pauserRoleUser).pause();
                await expect(tx).to.emit(contract, "Paused").withArgs(pauserRoleUser.address);
            });

            it("should revert when re-pausing", async function () {
                await contract.connect(pauserRoleUser).pause();
                await expect(contract.connect(pauserRoleUser).pause()).to.be.revertedWithCustomError(contract, "EnforcedPause");
            });
        });

        describe("unpause", function () {
            it("should initialize the contract in an unpaused state", async function () {
                expect(await contract.paused()).to.equal(false);
            });

            it("should emit an Unpaused event", async function () {
                await contract.connect(pauserRoleUser).pause();
                const tx = await contract.connect(pauserRoleUser).unpause();
                await expect(tx).to.emit(contract, "Unpaused").withArgs(pauserRoleUser.address);
            });

            it("should revert when re-unpausing", async function () {
                await contract.connect(pauserRoleUser).pause();
                await contract.connect(pauserRoleUser).unpause();
                await expect(contract.connect(pauserRoleUser).unpause()).to.be.revertedWithCustomError(contract, "ExpectedPause");
            });
        });
    });
});
