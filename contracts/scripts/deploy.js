const hre = require("hardhat");

async function main() {
  const PayForUpload = await hre.ethers.getContractFactory("PayForUpload");
  const uploadFee = hre.ethers.parseEther("0.001"); // 0.001 RBTC
  const contract = await PayForUpload.deploy(uploadFee);

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
  console.log("Upload fee:", uploadFee.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
