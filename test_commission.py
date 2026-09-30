"""
Self-check for Mutual Fund Sales & Commission Calculation Logic.
Verifies aggregation, rate computation, SIP/Lumpsum separation, and monthly filtering.
"""

def calculate_commission(amount: float, rate_percent: float) -> float:
    return round((amount * rate_percent) / 100.0, 2)

def aggregate_agent_sales(transactions, agent_id, month=None, year=None):
    total_sales = 0.0
    sip_total = 0.0
    lumpsum_total = 0.0
    total_commission = 0.0
    matching_txs = []

    for tx in transactions:
        if tx["agent_id"] != agent_id:
            continue

        # Date format YYYY-MM-DD
        tx_year, tx_month, _ = tx["date"].split("-")
        if year and tx_year != str(year):
            continue
        if month and tx_month != f"{int(month):02d}":
            continue

        amt = float(tx["amount"])
        comm = calculate_commission(amt, float(tx["commission_rate"]))

        total_sales += amt
        total_commission += comm
        if tx["type"].upper() == "SIP":
            sip_total += amt
        else:
            lumpsum_total += amt

        matching_txs.append({**tx, "commission": comm})

    return {
        "agent_id": agent_id,
        "total_sales": round(total_sales, 2),
        "sip_total": round(sip_total, 2),
        "lumpsum_total": round(lumpsum_total, 2),
        "total_commission": round(total_commission, 2),
        "count": len(matching_txs),
        "transactions": matching_txs
    }

def test_commission_math():
    # Test 1: Single calculation
    assert calculate_commission(100000, 1.5) == 1500.00
    assert calculate_commission(5000, 2.0) == 100.00
    assert calculate_commission(25000, 0.75) == 187.50

    # Test 2: Transactions aggregation
    transactions = [
        {"id": 1, "agent_id": "A1", "client_name": "Ramesh", "amount": 10000, "commission_rate": 1.5, "type": "SIP", "date": "2026-09-05"},
        {"id": 2, "agent_id": "A1", "client_name": "Suresh", "amount": 50000, "commission_rate": 1.5, "type": "Lumpsum", "date": "2026-09-12"},
        {"id": 3, "agent_id": "A1", "client_name": "Ramesh", "amount": 10000, "commission_rate": 1.5, "type": "SIP", "date": "2026-10-05"}, # Next month
        {"id": 4, "agent_id": "A2", "client_name": "Priya", "amount": 200000, "commission_rate": 2.0, "type": "Lumpsum", "date": "2026-09-20"},
    ]

    # September 2026 for Agent A1
    res_a1_sep = aggregate_agent_sales(transactions, "A1", month=9, year=2026)
    assert res_a1_sep["total_sales"] == 60000.00
    assert res_a1_sep["sip_total"] == 10000.00
    assert res_a1_sep["lumpsum_total"] == 50000.00
    # 10000 * 1.5% = 150, 50000 * 1.5% = 750 => Total 900.00
    assert res_a1_sep["total_commission"] == 900.00
    assert res_a1_sep["count"] == 2

    # September 2026 for Agent A2 (different commission rate: 2.0%)
    res_a2_sep = aggregate_agent_sales(transactions, "A2", month=9, year=2026)
    assert res_a2_sep["total_sales"] == 200000.00
    assert res_a2_sep["total_commission"] == 4000.00

    # All-time for Agent A1
    res_a1_all = aggregate_agent_sales(transactions, "A1")
    assert res_a1_all["total_sales"] == 70000.00
    assert res_a1_all["total_commission"] == 1050.00
    assert res_a1_all["count"] == 3

    print("All commission calculations and aggregation tests passed!")

if __name__ == "__main__":
    test_commission_math()
