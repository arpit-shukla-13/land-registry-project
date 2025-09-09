const { expect } = require("chai");
const { ethers } = require("hardhat");

// We group our tests together in a describe block.
// Hindi: Hum apne tests ko ek "describe" block mein rakhte hain.
describe("LandRegistry", function () {
  
  // A "beforeEach" block runs before each test. Here we deploy the contract.
  // Hindi: "beforeEach" block har test se pehle chalta hai. Hum yahan contract deploy karenge.
  beforeEach(async function () {
    // Get the signers (accounts) that Hardhat provides.
    // Hindi: Hardhat dwara diye gaye accounts (signers) ko prapt karein.
    [this.govAuthority, this.landOwner, this.otherUser] = await ethers.getSigners();

    // Deploy the LandRegistry contract.
    // Hindi: LandRegistry contract ko deploy karein.
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    this.landRegistry = await LandRegistry.connect(this.govAuthority).deploy();
  });

  // Test case 1: Check if the contract deploys successfully.
  // Hindi: Test case 1: Check karein ki contract safaltapoorvak deploy hua ya nahi.
  it("Should deploy successfully and set the government authority", async function () {
    // We expect the contract's governmentAuthority to be the address of the deployer.
    // Hindi: Hum ummeed karte hain ki contract ka governmentAuthority deployer ka address hoga.
    expect(await this.landRegistry.governmentAuthority()).to.equal(this.govAuthority.address);
  });

  // Test case 2: Test the land registration function.
  // Hindi: Test case 2: Land registration function ko test karein.
  it("Should allow the government authority to register a new land", async function () {
    // Call the registerLand function from the government's account.
    // Hindi: Government ke account se registerLand function ko call karein.
    await this.landRegistry.connect(this.govAuthority).registerLand(
      this.landOwner.address,
      "123 Main St, Delhi",
      "1500 sqft"
    );

    // Check if the landCount has increased to 1.
    // Hindi: Check karein ki landCount 1 ho gaya hai ya nahi.
    expect(await this.landRegistry.landCount()).to.equal(1);
    
    // Fetch the details of the newly registered land.
    // Hindi: Naye register kiye gaye land ki details prapt karein.
    const land = await this.landRegistry.landRecords(1);
    
    // Check if the owner of the land is set correctly.
    // Hindi: Check karein ki land ka maalik sahi se set hua hai ya nahi.
    expect(land.owner).to.equal(this.landOwner.address);
  });

});