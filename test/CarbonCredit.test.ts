import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CarbonCredit } from "../typechain-types";

describe("CarbonCredit", function () {
  let carbonCredit: CarbonCredit;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let admin: SignerWithAddress;

  beforeEach(async function () {
    [owner, seller, buyer, admin] = await ethers.getSigners();

    const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
    carbonCredit = await CarbonCredit.deploy();
    await carbonCredit.deployed();

    // Grant roles
    await carbonCredit.grantRole(await carbonCredit.ADMIN_ROLE(), admin.address);
    await carbonCredit.grantRole(await carbonCredit.MINTER_ROLE(), seller.address);
  });

  describe("Minting", function () {
    it("Should allow verified seller to mint credits", async function () {
      const projectName = "Test Project";
      const verifier = "Test Verifier";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
      const amount = 100;
      const metadataURI = "ipfs://QmTest";

      await carbonCredit.connect(admin).verifyOrUnverifySeller(seller.address, true);

      await expect(
        carbonCredit
          .connect(seller)
          .mintCredit(projectName, verifier, expiryDate, amount, metadataURI)
      )
        .to.emit(carbonCredit, "CreditMinted")
        .withArgs(1, projectName, seller.address, amount);

      const credit = await carbonCredit.credits(1);
      expect(credit.projectName).to.equal(projectName);
      expect(credit.totalCredits).to.equal(amount);
    });

    it("Should not allow unverified addresses to mint", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        carbonCredit
          .connect(buyer)
          .mintCredit("Test", "Test", expiryDate, 100, "ipfs://test")
      ).to.be.revertedWith("Must be minter or verified seller");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await carbonCredit.connect(admin).verifyOrUnverifySeller(seller.address, true);
      await carbonCredit
        .connect(seller)
        .mintCredit(
          "Test",
          "Test",
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          100,
          "ipfs://test"
        );
    });

    it("Should allow transfer of credits", async function () {
      await carbonCredit
        .connect(seller)
        .safeTransferFrom(seller.address, buyer.address, 1, 50, "0x");

      expect(await carbonCredit.balanceOf(buyer.address, 1)).to.equal(50);
    });
  });

  describe("Retiring Credits", function () {
    beforeEach(async function () {
      await carbonCredit.connect(admin).verifyOrUnverifySeller(seller.address, true);
      await carbonCredit
        .connect(seller)
        .mintCredit(
          "Test",
          "Test",
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          100,
          "ipfs://test"
        );
      await carbonCredit
        .connect(seller)
        .safeTransferFrom(seller.address, buyer.address, 1, 50, "0x");
    });

    it("Should allow retiring of credits", async function () {
      await expect(carbonCredit.connect(buyer).retireCredits(1, 25))
        .to.emit(carbonCredit, "CreditRetired")
        .withArgs(1, 25);

      expect(await carbonCredit.balanceOf(buyer.address, 1)).to.equal(25);
    });

    it("Should not allow retiring more credits than owned", async function () {
      await expect(
        carbonCredit.connect(buyer).retireCredits(1, 51)
      ).to.be.revertedWith("Insufficient credits to retire");
    });
  });
}); 