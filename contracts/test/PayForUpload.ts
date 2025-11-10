import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import "@nomicfoundation/hardhat-chai-matchers";

describe("PayForUpload", function () {
  let contract: any;
  let owner: any;
  let user: any;
  const uploadFee = ethers.parseEther("0.001");

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const PayForUpload = await ethers.getContractFactory("PayForUpload");
    contract = await PayForUpload.deploy(uploadFee);
  });

  it("sets owner and uploadFee correctly", async () => {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.uploadFee()).to.equal(uploadFee);
  });

  it("reverts if payment is less than uploadFee", async () => {
    const uploadId = ethers.randomBytes(32);

    await expect(
      contract.connect(user).payForUpload(uploadId, { value: 0 })
    ).to.be.revertedWith("Insufficient payment");
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
});
