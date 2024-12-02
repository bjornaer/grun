import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  // Deploy to Polygon
  console.log("Deploying CarbonCredit to Polygon...");
  
  const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
  const carbonCredit = await CarbonCredit.deploy();

  await carbonCredit.deployed();

  console.log("CarbonCredit deployed to:", carbonCredit.address);

  // Verify if on testnet or mainnet
  if (process.env.VERIFY_CONTRACT === "true") {
    console.log("Verifying contract on Polygonscan...");
    await verify(carbonCredit.address, []);
  }

  // Set up initial roles
  const [deployer] = await ethers.getSigners();
  const MINTER_ROLE = await carbonCredit.MINTER_ROLE();
  const ADMIN_ROLE = await carbonCredit.ADMIN_ROLE();

  await carbonCredit.grantRole(ADMIN_ROLE, deployer.address);
  console.log("Admin role granted to deployer");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contract: {
      address: carbonCredit.address,
      deployer: deployer.address,
    },
    timestamp: new Date().toISOString(),
  };

  // Save to file
  const fs = require("fs");
  const deploymentPath = `deployments/${network.name}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 