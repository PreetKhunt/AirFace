# Booking Window (Lead Time) Methodology Specification

---

## 1. Core Lead Time Formula & Primary Representation

### 1.1 Advance Booking Window Definition

The advance booking window (lead time) $h$ is defined as the integer number of full calendar days between ticket collection and scheduled departure:

$$h = \text{booking\_window\_days} = \text{Date}(\text{travel\_date}) - \text{Date}(\text{collection\_date})$$

`[OFFICIAL REQUIREMENT]` Mandatory advance booking horizons specified by SIH26056:

$$\mathcal{H} = \{ T+1, T+7, T+15, T+30, T+45 \}$$

---

## 2. Primary Architectural Mandate: Independent Horizon Indices

> [!IMPORTANT]
> **PRIMARY REPRESENTATION MANDATE:**  
> The system MUST calculate and preserve **separate, un-aggregated elementary price indices** for each advance booking horizon $h \in \mathcal{H}$.
> 
> *   $I_{r, T+1}^t$: Spot / Last-minute price index series
> *   $I_{r, T+7}^t$: Short-term advance price index series
> *   $I_{r, T+15}^t$: Standard leisure advance price index series
> *   $I_{r, T+30}^t$: Early booking price index series
> *   $I_{r, T+45}^t$: Baseline advance saver price index series

Observations from different lead times are **NEVER mixed together** inside elementary route index calculations.

---

## 3. Secondary / Optional Composite Horizon Aggregation

`[PROPOSED METHODOLOGY]` `[OPTIONAL INNOVATION]`

To provide policy planners with a single composite route price index, an optional horizon-weighted composite index $I_{r, Composite}^t$ MAY be computed.

### 3.1 Composite Formula

$$I_{r, Composite}^t = \sum_{h \in \mathcal{H}} \alpha_h \cdot I_{r, h}^t \quad \text{where } \sum_{h \in \mathcal{H}} \alpha_h = 1.0$$

### 3.2 Default Proposed Weights & Configuration

| Booking Horizon | Default Weight ($\alpha_h$) | Status Tag | Rationale & Segment |
|---|---|---|---|
| **$T+15$** | **0.40** (40%) | `[PROPOSED / CONFIGURABLE]` | Standard domestic leisure booking window |
| **$T+7$** | **0.25** (25%) | `[PROPOSED / CONFIGURABLE]` | Short-term business & corporate travel |
| **$T+30$** | **0.20** (20%) | `[PROPOSED / CONFIGURABLE]` | Early vacation planning |
| **$T+1$** | **0.10** (10%) | `[PROPOSED / CONFIGURABLE]` | Emergency / spot travel price surge |
| **$T+45$** | **0.05** (5%) | `[PROPOSED / CONFIGURABLE]` | Ultra-early baseline fare bucket |

> [!CAUTION]
> **COMPOSITE WEIGHTING DISCLAIMER:**  
> Horizon composite weights ($\alpha_h$) are **NOT officially mandated by MoSPI**. They are a proposed engineering option stored in `config/weights.yaml` and MUST be fully configurable by system administrators.

---

## 4. Execution Sampling Schedule

Daily automated scraper runs execute according to the following sampling offset matrix relative to current collection date $t$:

```
Current Date (t = 2026-10-01)
├── Target Travel Date T+1  : 2026-10-02
├── Target Travel Date T+7  : 2026-10-08
├── Target Travel Date T+15 : 2026-10-16
├── Target Travel Date T+30 : 2026-10-31
└── Target Travel Date T+45 : 2026-11-15
```
