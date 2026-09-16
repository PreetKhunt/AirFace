# Troubleshooting Guide
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Common Issues & Resolution Steps

### Issue 1: Database Connection Error (`psycopg2.OperationalError`)
* **Cause:** PostgreSQL container is starting up or port 5432 is blocked.
* **Fix:** Run `docker-compose logs db` to verify container health. Ensure PostgreSQL password in `.env` matches `docker-compose.yml`.

### Issue 2: Scraper Blocked / 403 Forbidden Response
* **Cause:** Target portal security block or Cloudflare rate limit.
* **Fix:** The system automatically logs `SOURCE_BLOCKED` and switches to `HISTORICAL_FIXTURE` mode. Verify that the UI displays `[HISTORICAL DEMO]` badge.

### Issue 3: Playwright Chromium Browser Launch Failure
* **Cause:** Missing system dependencies for Chromium.
* **Fix:** Execute `playwright install-deps` inside virtual environment or container.
