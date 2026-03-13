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
    function removeLiquidity(uint256 liquidityAmount) external returns (uint256 amountA, uint256 amountB) {
        // Implementation will be added later
    }

    function swapAForB(uint256 amountAIn) external returns (uint256 amountBOut) {
        // Implementation will be added later
    }

    function swapBForA(uint256 amountBIn) external returns (uint256 amountAOut) {
        // Implementation will be added later
    }

    function getPrice() external view returns (uint256 price) {
        // Implementation will be added later
    }

    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        // Implementation will be added later
    }
}