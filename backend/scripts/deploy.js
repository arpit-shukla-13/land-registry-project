const { ethers } = require("hardhat");

async function main() {
  // Get the account that will deploy the contract
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Get the Contract Factory for LandRegistry
  const LandRegistry = await ethers.getContractFactory("LandRegistry");

  // Deploy the contract
  const landRegistry = await LandRegistry.deploy();

  // Wait for the contract to be deployed
  await landRegistry.waitForDeployment();

  // Log the address of the deployed contract
  console.log("LandRegistry contract deployed to:", landRegistry.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});