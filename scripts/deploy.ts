import { ethers } from "hardhat";

async function main() {
  const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
  const carbonCredit = await CarbonCredit.deploy();

  await carbonCredit.deployed();

  console.log("CarbonCredit deployed to:", carbonCredit.address);

  // Verify contract on Etherscan/Polygonscan
  if (process.env.ETHERSCAN_API_KEY) {
    await verify(carbonCredit.address, []);
  }
}

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if ((e as Error).message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.error(e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 