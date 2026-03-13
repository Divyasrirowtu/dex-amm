const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);

    // Approve DEX to spend tokens
    await tokenA.connect(owner).approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.connect(owner).approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  // Tests go here
});
describe("Liquidity Management", function () {
  it("should allow initial liquidity provision", async function () {
    await expect(dex.addLiquidity(
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("200")
    )).to.emit(dex, "LiquidityAdded");
  });

  it("should mint correct LP tokens for first provider", async function () {
    const tx = await dex.addLiquidity(
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("200")
    );
    const receipt = await tx.wait();
    const liquidityMinted = (await dex.totalLiquidity());
    expect(liquidityMinted).to.be.gt(0);
  });

  it("should allow subsequent liquidity additions", async function () {
    await dex.addLiquidity(
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("200")
    );
    await expect(dex.addLiquidity(
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("100")
    )).to.emit(dex, "LiquidityAdded");
  });
});