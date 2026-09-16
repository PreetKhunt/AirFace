# DGCA Backtest Data Verification Report

*See full research document at [03-dgca-data-research.md](file:///c:/Users/kenil/OneDrive/Desktop/Anti/SIH/docs/research/03-dgca-data-research.md)*

## Key Verification Summary

1. **First-Party Status:**
   - DGCA City-Pair Traffic Statistics: **VERIFIED FIRST-PARTY** (`dgca.gov.in`).
   - DGCA Public Historical Fare Micro-Dataset CSV: **NOT VERIFIED AT FIRST-PARTY LEVEL**.

2. **Impact on SIH 30-Day Backtest Requirement:**
   - The 30-day backtest cannot rely on a non-existent DGCA public fare API.
   - It will utilize DGCA passenger volume for weights + a 30-day calibrated scraped reference dataset for price evaluation metrics (MAPE, RMSE).
