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

    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  describe("Liquidity Management", function () {
    it("should allow initial liquidity provision", async function () {
      const liquidity = await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(await dex.totalLiquidity()).to.equal(liquidity);
      const [reserveA, reserveB] = await dex.getReserves();
      expect(reserveA).to.equal(ethers.utils.parseEther("100"));
      expect(reserveB).to.equal(ethers.utils.parseEther("200"));
    });

    it("should mint correct LP tokens for first provider", async function () {
      const liquidity = await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      const sqrt = (a, b) => ethers.BigNumber.from(a).mul(b).sqrt();
      const expected = sqrt(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      expect(liquidity).to.equal(expected);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const liquidity = await dex.addLiquidity(ethers.utils.parseEther("50"), ethers.utils.parseEther("100"));
      expect(await dex.totalLiquidity()).to.be.gt(0);
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await dex.addLiquidity(ethers.utils.parseEther("50"), ethers.utils.parseEther("100"));
      const price = await dex.getPrice();
      expect(price).to.equal(ethers.utils.parseEther("2")); // 200/100 = 2
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const [amountA, amountB] = await dex.removeLiquidity(ethers.utils.parseEther("50"));
      expect(amountA).to.be.gt(0);
      expect(amountB).to.be.gt(0);
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const [amountA, amountB] = await dex.removeLiquidity(ethers.utils.parseEther("50"));
      expect(amountB).to.equal(amountA.mul(2)); // maintains ratio 100:200
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, 0)).to.be.reverted;
    });

    it("should revert when removing more liquidity than owned", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.removeLiquidity(ethers.utils.parseEther("1000"))).to.be.reverted;
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
    });

    it("should swap token A for token B", async function () {
      const amountOut = await dex.swapAForB(ethers.utils.parseEther("10"));
      expect(amountOut).to.be.gt(0);
    });

    it("should swap token B for token A", async function () {
      const amountOut = await dex.swapBForA(ethers.utils.parseEther("20"));
      expect(amountOut).to.be.gt(0);
    });

    it("should calculate correct output amount with fee", async function () {
      const out = await dex.getAmountOut(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      const expected = ethers.utils.parseEther("18.151846"); // approximately 18.18
      expect(out).to.be.closeTo(expected, ethers.utils.parseEther("0.01"));
    });

    it("should update reserves after swap", async function () {
      const before = await dex.getReserves();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const after = await dex.getReserves();
      expect(after[0]).to.be.gt(before[0]); // reserveA increased
      expect(after[1]).to.be.lt(before[1]); // reserveB decreased
    });

    it("should increase k after swap due to fees", async function () {
      const [reserveA, reserveB] = await dex.getReserves();
      const kBefore = reserveA.mul(reserveB);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [newA, newB] = await dex.getReserves();
      const kAfter = newA.mul(newB);
      expect(kAfter).to.be.gt(kBefore);
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.reverted;
    });

    it("should handle large swaps with high price impact", async function () {
      await dex.swapAForB(ethers.utils.parseEther("90"));
      const [reserveA, reserveB] = await dex.getReserves();
      expect(reserveA).to.be.gt(0);
      expect(reserveB).to.be.gt(0);
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(ethers.utils.parseEther("10"));
      await dex.swapBForA(ethers.utils.parseEther("20"));
      const [reserveA, reserveB] = await dex.getReserves();
      expect(reserveA).to.be.gt(0);
      expect(reserveB).to.be.gt(0);
    });
  });

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const price = await dex.getPrice();
      expect(price).to.equal(ethers.utils.parseEther("2"));
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const price = await dex.getPrice();
      expect(price).to.be.gt(0);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      const price = await dex.getPrice();
      expect(price).to.equal(0);
    });
  });

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200")))
        .to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.removeLiquidity(ethers.utils.parseEther("10")))
        .to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.swapAForB(ethers.utils.parseEther("10"))).to.emit(dex, "Swap");
    });
  });
});