import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import "@nomicfoundation/hardhat-chai-matchers";

describe("PayForUpload", function () {
  let contract: any;
  let owner: any;
  let user: any;
  let otherUser: any;
  const uploadFee = ethers.parseEther("0.00001");

  beforeEach(async () => {
    [owner, user, otherUser] = await ethers.getSigners();
    const PayForUpload = await ethers.getContractFactory("PayForUpload");
    contract = await PayForUpload.deploy(uploadFee);
  });

  it("sets owner and uploadFee correctly", async () => {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.pendingOwner()).to.equal(ethers.ZeroAddress);
    expect(await contract.uploadFee()).to.equal(uploadFee);
  });

  it("reverts if payment is less than uploadFee", async () => {
    const uploadId = ethers.randomBytes(32);

    await expect(
      contract.connect(user).payForUpload(uploadId, { value: 0 })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("rejects direct RBTC transfers", async () => {
    await expect(
      user.sendTransaction({
        to: await contract.getAddress(),
        value: uploadFee,
      })
    ).to.be.revertedWith("Use payForUpload");
  });

  it("emits Paid event with correct data", async () => {
    const uploadId = ethers.randomBytes(32);

    await expect(
      contract.connect(user).payForUpload(uploadId, { value: uploadFee })
    )
      .to.emit(contract, "Paid")
      .withArgs(
        user.address,
        uploadFee,
        ethers.hexlify(uploadId),
        anyValue
      );
  });

  it("prevents non-owner from withdrawing", async () => {
    await expect(contract.connect(user).withdraw()).to.be.revertedWith("Only owner");
  });

  it("allows owner to withdraw funds", async () => {
    const uploadId = ethers.randomBytes(32);

    await contract.connect(user).payForUpload(uploadId, { value: uploadFee });

    const before = await ethers.provider.getBalance(owner.address);
    const tx = await contract.withdraw();
    await tx.wait();
    const after = await ethers.provider.getBalance(owner.address);

    expect(after).to.be.gt(before);
  });

  it("starts a two-step ownership transfer", async () => {
    await expect(contract.transferOwnership(user.address))
      .to.emit(contract, "OwnershipTransferStarted")
      .withArgs(owner.address, user.address);

    expect(await contract.pendingOwner()).to.equal(user.address);
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("prevents non-owner from starting ownership transfer", async () => {
    await expect(
      contract.connect(user).transferOwnership(otherUser.address)
    ).to.be.revertedWith("Only owner");
  });

  it("allows pending owner to accept ownership", async () => {
    await contract.transferOwnership(user.address);

    await expect(contract.connect(user).acceptOwnership())
      .to.emit(contract, "OwnershipTransferred")
      .withArgs(owner.address, user.address);

    expect(await contract.owner()).to.equal(user.address);
    expect(await contract.pendingOwner()).to.equal(ethers.ZeroAddress);
  });

  it("prevents non-pending owner from accepting ownership", async () => {
    await contract.transferOwnership(user.address);

    await expect(contract.connect(otherUser).acceptOwnership()).to.be.revertedWith(
      "Only pending owner"
    );
  });
});
