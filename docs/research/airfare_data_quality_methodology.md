# Airfare Data Quality Methodology

*See full research document at [07-fare-normalization.md](file:///c:/Users/kenil/OneDrive/Desktop/Anti/SIH/docs/research/07-fare-normalization.md)*

## Summary of Rules

1. **Normalized Fare Equation:**
   $$\text{Normalized\_Fare} = \text{Base\_Fare} + \text{UDF} + \text{ASF} + \text{GST}$$
   *Excludes payment convenience fees, optional baggage, seat selection, and bank promos.*

2. **Deduplication:**
   Matches `(origin, destination, airline_code, flight_number, travel_date)`. Retains minimum mandatory total fare across verified channels.

3. **Outlier Filtering:**
   Tukey IQR boundaries distinguish DOM parsing glitches from genuine market demand surges.
