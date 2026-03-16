from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(tags=["Analytics"])

@router.get("/spending-analysis")
async def get_spending_analysis(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    accounts = await db.accounts.find({"user_id": current_user["user_id"]}).to_list(100)
    if not accounts:
        return {"by_category": [], "daily": []}
    account_ids = [a["account_id"] for a in accounts]

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    pipeline_category = [
        {"$match": {"account_id": {"$in": account_ids}, "created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$project": {
            "category": "$_id",
            "total": 1,
            "count": 1,
            "_id": 0
        }},
        {"$sort": {"total": -1}}
    ]
    
    pipeline_daily = [
        {"$match": {"account_id": {"$in": account_ids}, "created_at": {"$gte": thirty_days_ago}}},
        {"$project": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "type": 1,
            "amount": 1
        }},
        {"$group": {
            "_id": {"date": "$date", "type": "$type"},
            "total": {"$sum": "$amount"}
        }},
        {"$project": {
            "date": "$_id.date",
            "type": "$_id.type",
            "total": 1,
            "_id": 0
        }},
        {"$sort": {"date": -1}}
    ]

    by_category = await db.ledger_entries.aggregate(pipeline_category).to_list(None)
    daily = await db.ledger_entries.aggregate(pipeline_daily).to_list(None)
    
    # We should convert 'total' fields (which might be Decimal128) to float so Pydantic/fastapi serializes them properly
    for item in by_category:
        try:
            item["total"] = float(str(item["total"]))
        except:
            pass

    for item in daily:
        try:
            item["total"] = float(str(item["total"]))
        except:
            pass

    return {"by_category": by_category, "daily": daily}


@router.get("/stats/overview")
async def get_stats_overview(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Admin/CEO: Get overarching system statistics."""
    # Sadece yetkili kullanıcılar görmeli (roles: admin/staff/ceo vb. projenize göre)
    if current_user["role"] == "customer":
        return {"total_users": 0, "active_users": 0, "total_accounts": 0, "total_transactions": 0}

    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"kyc_status": "APPROVED"})
    total_accounts = await db.accounts.count_documents({})
    total_transactions = await db.ledger_entries.count_documents({})
    
    # Calculate Total Commission Revenue
    commission_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    commission_cur = await db.commission_ledger.aggregate(commission_pipeline).to_list(1)
    total_commission = commission_cur[0]["total"] if commission_cur else 0.0

    # Calculate Total Investment Volume
    inv_pipeline = [
        {"$project": {"value": {"$multiply": ["$quantity", "$average_buy_price"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$value"}}}
    ]
    inv_cur = await db.investment_portfolio.aggregate(inv_pipeline).to_list(1)
    total_investment_volume = inv_cur[0]["total"] if inv_cur else 0.0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_accounts": total_accounts,
        "total_transactions": total_transactions,
        "total_commission_revenue": total_commission,
        "total_investment_volume": total_investment_volume
    }


@router.get("/reports/monthly")
async def get_monthly_report(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Admin/CEO: Get monthly financial and growth report."""
    if current_user["role"] == "customer":
        return {}

    # O ayın başlangıç ve bitiş tarihlerini belirleyelim
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    # 1. Finansal Akış (Yatırım / Çekim)
    pipeline_financials = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lt": end_date},
            "type": {"$in": ["deposit", "withdrawal"]}
        }},
        {"$group": {
            "_id": "$type",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    fin_results = await db.ledger_entries.aggregate(pipeline_financials).to_list(None)

    total_deposits = 0.0
    deposit_count = 0
    total_withdrawals = 0.0
    withdrawal_count = 0

    for res in fin_results:
        amount = float(str(res["total_amount"]))
        if res["_id"] == "deposit":
            total_deposits = amount
            deposit_count = res["count"]
        elif res["_id"] == "withdrawal":
            # Withdrawal tutarları genelde eksi (-), mutlak değere çevirelim rapor için
            total_withdrawals = abs(amount)
            withdrawal_count = res["count"]

    net_flow = total_deposits - total_withdrawals

    # 2. Büyüme Metrikleri (O ay açılan kullanıcı ve hesaplar)
    new_users = await db.users.count_documents({
        "created_at": {"$gte": start_date, "$lt": end_date}
    })
    
    new_accounts = await db.accounts.count_documents({
        "created_at": {"$gte": start_date, "$lt": end_date}
    })

    # 3. Aylık Komisyon Geliri
    pipeline_comm = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {
            "_id": None,
            "total_commission": {"$sum": "$amount"}
        }}
    ]
    month_comm_res = await db.commission_ledger.aggregate(pipeline_comm).to_list(1)
    monthly_commission = float(str(month_comm_res[0]["total_commission"])) if month_comm_res else 0.0

    return {
        "total_deposits": total_deposits,
        "deposit_count": deposit_count,
        "total_withdrawals": total_withdrawals,
        "withdrawal_count": withdrawal_count,
        "net_flow": net_flow,
        "new_users": new_users,
        "new_accounts": new_accounts,
        "monthly_commission_revenue": monthly_commission,
        "year": year,
        "month": month
    }
