# DEX AMM Project

## Overview
A simplified decentralized exchange (DEX) using Automated Market Maker (AMM) model (like Uniswap V2).

## Features
- Add and remove liquidity with LP tokens
- Swap between two ERC-20 tokens
- 0.3% trading fee for LPs
- Constant product formula x * y = k

## Architecture
- `DEX.sol` handles liquidity, swaps, and LP tokens
- `MockERC20.sol` provides test ERC-20 tokens
- Tests in `DEX.test.js` cover all core functionality

## Mathematical Implementation
- **Initial liquidity:** `sqrt(amountA * amountB)` LP tokens minted
- **Subsequent liquidity:** maintain ratio `amountB = amountA * reserveB / reserveA`
- **Liquidity removal:** proportional to LP tokens burned
- **Swap formula (with 0.3% fee):**

amountInWithFee = amountIn * 997
amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)


## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Git

### Installation
```powershell
git clone <your-repo-url>
cd dex-amm
docker-compose up -d
docker-compose exec dex-app npm run compile
docker-compose exec dex-app npm test
docker-compose exec dex-app npm run coverage
docker-compose down

Running Tests Locally
npm install
npm run compile
npm test
npm run coverage

Contract Addresses

(If deployed, add here)

Known Limitations

Only supports 1 trading pair per DEX instance

No slippage protection implemented

Security Considerations

Uses SafeERC20 for transfers

Checks for zero inputs

Resists reentrancy attacks (ReentrancyGuard can be added)


