# Data Provenance Strategy

*See full research document at [13-live-historical-synthetic-data.md](file:///c:/Users/kenil/OneDrive/Desktop/Anti/SIH/docs/research/13-live-historical-synthetic-data.md)*

## Key Principles

1. **Strict Partitioning:** Data modes `LIVE`, `HISTORICAL`, and `SYNTHETIC` are explicitly isolated.
2. **Provenance Badges:** Every UI view and API output badges the active mode (`[LIVE]`, `[HISTORICAL]`, `[SYNTHETIC]`).
3. **No Synthetic Misrepresentation:** Synthetic data is never passed off as live scraped data.
