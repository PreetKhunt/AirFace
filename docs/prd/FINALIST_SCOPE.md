# Finalist Scope Specification (Grand Finale & Production Readiness)
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Finalist Scope Overview

The **Finalist Scope** defines the expanded production feature set targeted for the SIH Grand Finale and subsequent deployment into MoSPI's Data Informatics & Innovation Division (DIID) infrastructure.

---

## 2. Expanded Production Capabilities Matrix

| Feature Domain | MVP Prototype Capability | Finalist / Production Expanded Scope | Strategic Value to MoSPI |
|---|---|---|---|
| **Route Coverage** | Top 15 Domestic Corridors | **50+ Domestic City Pairs + Top 20 International Routes** (COICOP 2018 Division 07 Alignment) | Captures complete national domestic & international air travel inflation |
| **Portal Scraping Fleet** | 3 Portals (IndiGo, MakeMyTrip, EaseMyTrip) | **11 Portals:** 6 Domestic Carriers (IndiGo, Air India, Akasa, SpiceJet, AI Express, Alliance Air) + 5 OTAs (MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, Goibibo) | Provides 100% market coverage across all Indian scheduled air transport |
| **DGCA Ingestion Pipeline** | Manual CSV upload | **Automated DGCA Report Parser:** Cron worker automatically polling `dgca.gov.in` for new monthly passenger Excel releases | Zero-touch route weight updates $w_r$ upon DGCA publication |
| **AI Anomaly Detection** | Tukey IQR Statistical Rule | **Isolation Forest Machine Learning:** Auto-trained on 90-day historical scraped fare distributions to flag complex parsing anomalies | Eliminates manual outlier verification overhead |
| **Scraper Auto-Healing** | Manual selector maintenance | **AI DOM Drift Auto-Healing:** Structural HTML tree comparison automatically updating broken CSS selectors upon portal redesigns | Prevents scraper downtime during target site updates |
| **Index Forecasting** | Historical tracking only | **Prophet / SARIMAX Short-Term Forecasting:** 7-day, 14-day, and 30-day forward index trend projections | Gives MoSPI policy planners early warning inflation indicators |
| **Automated NLG Reports** | Manual data inspection | **Automated Natural Language Press Release Generator:** LLM/Template module generating monthly textual executive summaries | Assists NSO statisticians in drafting monthly CPI press releases |
| **NSO Enterprise Integration** | Static CSV/JSON downloads | **Production REST API & GraphQL Endpoint:** Direct secure integration into NSO's eSankhyiki Data Portal | Enables automated ingestion into national CPI warehouse |
| **High Availability** | Single-node deployment | **Multi-Region Kubernetes Cluster:** Distributed scraper nodes with Redis queue & PostgreSQL Read Replicas | 99.99% system availability and high scraping throughput |

---

## 3. Transition Roadmap from MVP to Finalist Scope

```
 [ MVP Prototype (Phase 1) ]
 - 15 Top Routes
 - 3 Portal Scrapers
 - Basic Jevons/Young Index
 - Manual Backtest & Dashboard
            │
            ▼
 [ Finalist Enhancements (Phase 2) ]
 - Expand to 50+ Routes & International Corridors
 - Scrape 11 Carriers & OTAs
 - Automated DGCA Weight Ingestion Pipeline
 - AI Anomaly Detection (Isolation Forest)
            │
            ▼
 [ MoSPI Production Deployment (Phase 3) ]
 - Enterprise REST/GraphQL API for NSO eSankhyiki Portal
 - Multi-Region Kubernetes Deployment
 - Automated NLG Press Release Generator
```
