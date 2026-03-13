// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DEX {
    using SafeERC20 for IERC20;

    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // Events
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityBurned);
    event Swap(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidityMinted) {
    require(amountA > 0 && amountB > 0, "Cannot add zero liquidity");

    IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
    IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

    if (totalLiquidity == 0) {
        // First liquidity provider
        liquidityMinted = sqrt(amountA * amountB);
        totalLiquidity = liquidityMinted;
        liquidity[msg.sender] = liquidityMinted;
    } else {
    // Maintain ratio: amountB_required = (amountA * reserveB) / reserveA
    uint256 amountBOptimal = (amountA * reserveB) / reserveA;
    require(amountB >= amountBOptimal, "Insufficient amountB to maintain ratio");

    liquidityMinted = (amountA * totalLiquidity) / reserveA; // proportional LP tokens
    totalLiquidity += liquidityMinted;
    liquidity[msg.sender] += liquidityMinted;

    // If user sent extra tokenB, refund the excess
    if (amountB > amountBOptimal) {
        uint256 refund = amountB - amountBOptimal;
        IERC20(tokenB).safeTransfer(msg.sender, refund);
        amountB = amountBOptimal; // only add optimal amount to pool
    }
}

    // Update reserves
    reserveA += amountA;
    reserveB += amountB;

    emit LiquidityAdded(msg.sender, amountA, amountB, liquidityMinted);
    return liquidityMinted;
}

// Internal helper function to calculate square root
function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y != 0) {
        z = 1;
    }
}
    function removeLiquidity(uint256 liquidityAmount) 
    external 
    returns (uint256 amountA, uint256 amountB) 
{
    require(liquidityAmount > 0, "Cannot remove zero liquidity");
    require(liquidity[msg.sender] >= liquidityAmount, "Not enough LP tokens");

    // Calculate proportional amounts to withdraw
    amountA = (liquidityAmount * reserveA) / totalLiquidity;
    amountB = (liquidityAmount * reserveB) / totalLiquidity;

    // Update state
    liquidity[msg.sender] -= liquidityAmount;
    totalLiquidity -= liquidityAmount;

    reserveA -= amountA;
    reserveB -= amountB;

    // Transfer tokens back to user
    IERC20(tokenA).safeTransfer(msg.sender, amountA);
    IERC20(tokenB).safeTransfer(msg.sender, amountB);

    emit LiquidityRemoved(msg.sender, amountA, amountB, liquidityAmount);
}

    function swapAForB(uint256 amountAIn) 
    external 
    returns (uint256 amountBOut) 
{
    require(amountAIn > 0, "Swap amount must be > 0");

    // Calculate output
    amountBOut = getAmountOut(amountAIn, reserveA, reserveB);

    // Update reserves
    reserveA += amountAIn;
    reserveB -= amountBOut;

    // Transfer tokens
    IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountAIn);
    IERC20(tokenB).safeTransfer(msg.sender, amountBOut);

    emit Swap(msg.sender, tokenA, tokenB, amountAIn, amountBOut);
}

    function swapBForA(uint256 amountBIn) 
    external 
    returns (uint256 amountAOut) 
{
    require(amountBIn > 0, "Swap amount must be > 0");

    // Calculate output
    amountAOut = getAmountOut(amountBIn, reserveB, reserveA);

    // Update reserves
    reserveB += amountBIn;
    reserveA -= amountAOut;

    // Transfer tokens
    IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBIn);
    IERC20(tokenA).safeTransfer(msg.sender, amountAOut);

    emit Swap(msg.sender, tokenB, tokenA, amountBIn, amountAOut);
}

    function getPrice() external view returns (uint256 price) {
        // Implementation will be added later
    }

    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
    public 
    pure 
    returns (uint256 amountOut) 
{
    require(amountIn > 0, "Amount in must be > 0");
    require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");

    uint256 amountInWithFee = amountIn * 997; // 0.3% fee
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * 1000) + amountInWithFee;
    amountOut = numerator / denominator;
}
}