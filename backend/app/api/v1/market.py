import structlog
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Any
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.ledger_service import LedgerService
from app.models.investment import InvestmentTransaction, InvestmentPortfolioEntry
from typing import List, Optional, Any
from pydantic import BaseModel, Field
import yfinance as yf
import requests
import time

logger = structlog.get_logger()
router = APIRouter(prefix="/market", tags=["Market"])

# Define the MarketAsset model early so the type hints know what it is
class MarketAsset(BaseModel):
    id: str
    symbol: str
    name: str
    current_price: float
    price_change_percentage_24h: float
    market_cap: float
    type: str = Field(description="crypto or stock")

# A simple in-memory cache to prevent spamming APIs (especially CoinGecko which has tight rate limits)
CACHE_TTL = 300  # 5 minutes
crypto_cache: dict[str, Any] = {"timestamp": 0.0, "data": []}
stock_cache: dict[str, Any] = {"timestamp": 0.0, "data": []}

# Define the assets we want to track
TRACKED_CRYPTOS = [
    {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin"},
    {"id": "ethereum", "symbol": "ETH", "name": "Ethereum"},
    {"id": "binancecoin", "symbol": "BNB", "name": "BNB"},
    {"id": "solana", "symbol": "SOL", "name": "Solana"},
    {"id": "ripple", "symbol": "XRP", "name": "XRP"},
    {"id": "cardano", "symbol": "ADA", "name": "Cardano"},
    {"id": "dogecoin", "symbol": "DOGE", "name": "Dogecoin"},
    {"id": "polkadot", "symbol": "DOT", "name": "Polkadot"},
    {"id": "avalanche-2", "symbol": "AVAX", "name": "Avalanche"},
    {"id": "chainlink", "symbol": "LINK", "name": "Chainlink"},
    {"id": "tron", "symbol": "TRX", "name": "TRON"},
    {"id": "polygon", "symbol": "MATIC", "name": "Polygon"},
    {"id": "shiba-inu", "symbol": "SHIB", "name": "Shiba Inu"},
    {"id": "litecoin", "symbol": "LTC", "name": "Litecoin"},
    {"id": "dai", "symbol": "DAI", "name": "Dai"},
    {"id": "bitcoin-cash", "symbol": "BCH", "name": "Bitcoin Cash"},
    {"id": "cosmos", "symbol": "ATOM", "name": "Cosmos"},
    {"id": "near", "symbol": "NEAR", "name": "NEAR Protocol"},
    {"id": "uniswap", "symbol": "UNI", "name": "Uniswap"},
    {"id": "stellar", "symbol": "XLM", "name": "Stellar"},
]

TRACKED_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corp."},
    {"symbol": "NVDA", "name": "NVIDIA Corp."},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "GOOGL", "name": "Alphabet Inc."},
    {"symbol": "META", "name": "Meta Platforms"},
    {"symbol": "NFLX", "name": "Netflix Inc."},
    {"symbol": "BRK-B", "name": "Berkshire Hathaway"},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "JPM", "name": "JPMorgan Chase"},
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "MA", "name": "Mastercard Inc."},
    {"symbol": "PG", "name": "Procter & Gamble"},
    {"symbol": "AMD", "name": "Advanced Micro Devices"},
    {"symbol": "DIS", "name": "Walt Disney Co."},
    {"symbol": "ADBE", "name": "Adobe Inc."},
    {"symbol": "CRM", "name": "Salesforce Inc."},
    {"symbol": "PYPL", "name": "PayPal Holdings"},
    {"symbol": "KO", "name": "Coca-Cola Co."},
    {"symbol": "PEP", "name": "PepsiCo Inc."},
    {"symbol": "ORCL", "name": "Oracle Corp."},
    {"symbol": "IBM", "name": "IBM Corp."},
]

@router.get("/crypto", response_model=List[MarketAsset])
async def get_crypto_prices():
    """Fetch live cryptocurrency prices from CoinGecko."""
    global crypto_cache
    
    current_time = time.time()
    if current_time - crypto_cache["timestamp"] < CACHE_TTL and crypto_cache["data"]:
        return crypto_cache["data"]
        
    try:
        # CoinGecko simple/price API
        ids = ",".join([c["id"] for c in TRACKED_CRYPTOS])
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true"
        
        # Add a timeout
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        assets = []
        for crypto in TRACKED_CRYPTOS:
            c_id = crypto["id"]
            if c_id in data:
                assets.append(MarketAsset(
                    id=c_id,
                    symbol=crypto["symbol"],
                    name=crypto["name"],
                    current_price=data[c_id].get("usd", 0.0),
                    price_change_percentage_24h=data[c_id].get("usd_24h_change", 0.0),
                    market_cap=data[c_id].get("usd_market_cap", 0.0),
                    type="crypto"
                ))
                
        crypto_cache["timestamp"] = float(current_time)
        crypto_cache["data"] = assets
        return assets
        
    except Exception as e:
        logger.error("Failed to fetch crypto prices", error=str(e))
        # If API fails but we have stale cache, return it
        if crypto_cache["data"]:
            return crypto_cache["data"]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Market data is currently unavailable (Crypto)"
        )

@router.get("/stocks", response_model=List[MarketAsset])
async def get_stock_prices():
    """Fetch live stock prices using yfinance."""
    global stock_cache
    
    current_time = time.time()
    if current_time - stock_cache["timestamp"] < CACHE_TTL and stock_cache["data"]:
        return stock_cache["data"]
        
    try:
        symbols = " ".join([s["symbol"] for s in TRACKED_STOCKS])
        tickers = yf.Tickers(symbols)
        
        assets = []
        for stock in TRACKED_STOCKS:
            ticker = tickers.tickers.get(stock["symbol"])
            if ticker:
                # yfinance can sometimes be slow or return None for certain fields
                info = ticker.fast_info
                
                # fast_info doesn't have 24h change directly, calculate approximation or omit
                current_price = info.last_price
                previous_close = info.previous_close
                change_pct = 0.0
                if current_price and previous_close:
                    change_pct = ((current_price - previous_close) / previous_close) * 100
                    
                market_cap = info.market_cap or 0.0
                
                if current_price:
                    assets.append(MarketAsset(
                        id=stock["symbol"].lower(),
                        symbol=stock["symbol"],
                        name=stock["name"],
                        current_price=float(current_price),
                        price_change_percentage_24h=float(change_pct),
                        market_cap=float(market_cap),
                        type="stock"
                    ))
                    
        stock_cache["timestamp"] = float(current_time)
        stock_cache["data"] = assets
        return assets
        
    except Exception as e:
        logger.error("Failed to fetch stock prices", error=str(e))
        # If API fails but we have stale cache, return it
        if stock_cache["data"]:
            return stock_cache["data"]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Market data is currently unavailable (Stocks)"
        )


@router.get("/portfolio", response_model=List[InvestmentPortfolioEntry])
async def get_portfolio(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get the user's investment portfolio."""
    portfolio = await db.investment_portfolio.find({"customer_id": current_user["user_id"]}).to_list(100)
    
    # Enrich with current prices
    global crypto_cache, stock_cache
    
    # We will trigger the background price fetch if needed
    if not crypto_cache["data"] and time.time() - crypto_cache["timestamp"] > CACHE_TTL:
        try:
             await get_crypto_prices()
        except: pass
        
    if not stock_cache["data"] and time.time() - stock_cache["timestamp"] > CACHE_TTL:
        try:
             await get_stock_prices()
        except: pass

    market_lookup = {}
    for asset in (crypto_cache["data"] or []) + (stock_cache["data"] or []):
        market_lookup[asset.id] = asset

    result = []
    for p in portfolio:
        p["id"] = str(p.get("id"))
        p.pop("_id", None)
        result.append(p)
        
    return result


@router.post("/buy")
async def buy_asset(
    body: InvestmentTransaction,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Buy an asset (crypto or stock)."""
    # 1. Fetch current price
    price = await _get_current_asset_price(body.asset_id, body.asset_type)
    if not price:
        raise HTTPException(status_code=404, detail="Asset price not found")
    
    # 2. Calculate Commission (1.5%)
    total_value = body.quantity * price
    commission = total_value * 0.015

    # 3. Execute Trade
    ledger = LedgerService(db)
    try:
        txn_ref = await ledger.execute_investment_trade(
            account_id=body.source_account_id,
            customer_id=current_user["user_id"],
            asset_id=body.asset_id,
            asset_type=body.asset_type,
            symbol=body.asset_id.upper() if body.asset_type == "crypto" else body.asset_id.upper(), # Need to use correct lookup for symbol
            quantity=body.quantity,
            price_per_unit=price,
            trade_type="BUY",
            commission_amount=commission,
            created_by=current_user["user_id"]
        )
        return {"status": "success", "transaction_ref": txn_ref, "message": "Purchase successful"}
    except Exception as e:
        logger.error("Trade execution failed: BUY", error=str(e))
        raise HTTPException(status_code=400, detail=f"Purchase failed: {str(e)}")


@router.post("/sell")
async def sell_asset(
    body: InvestmentTransaction,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Sell an asset (crypto or stock)."""
    # 1. Fetch current price
    price = await _get_current_asset_price(body.asset_id, body.asset_type)
    if not price:
        raise HTTPException(status_code=404, detail="Varlık fiyati bulunamadi")
    
    # 2. Calculate Commission (1.5%)
    total_value = body.quantity * price
    commission = total_value * 0.015

    # 3. Execute Trade
    ledger = LedgerService(db)
    try:
        txn_ref = await ledger.execute_investment_trade(
            account_id=body.source_account_id,
            customer_id=current_user["user_id"],
            asset_id=body.asset_id,
            asset_type=body.asset_type,
            symbol=body.asset_id.upper(), # Approximation
            quantity=body.quantity,
            price_per_unit=price,
            trade_type="SELL",
            commission_amount=commission,
            created_by=current_user["user_id"]
        )
        return {"status": "success", "transaction_ref": txn_ref, "message": "Sale successful"}
    except Exception as e:
        logger.error("Trade execution failed: SELL", error=str(e))
        raise HTTPException(status_code=400, detail=f"Sale failed: {str(e)}")


async def _get_current_asset_price(asset_id: str, asset_type: str) -> Optional[float]:
    """Helper to fetch the current live price of an asset from cache or API."""
    if asset_type == "crypto":
        assets = await get_crypto_prices()
    else:
        assets = await get_stock_prices()
        
    for asset in assets:
        if asset.id == asset_id or asset.symbol.lower() == asset_id.lower():
            return float(asset.current_price)
    
    return None
