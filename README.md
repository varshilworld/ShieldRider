# ShieldRider – Gig Worker Income Protection Platform

## 🚀 Prototype – AI Powered License

A smart parametric insurance platform designed to protect gig workers such as delivery riders from income loss caused by environmental and social disruptions.

---

## 🎬 Demo

**Demo Video:** [https://drive.google.com/file/d/1VhG5So33ppznQhQuhWPvAFH4ZdGT8yKV/view?usp=sharing](https://drive.google.com/file/d/1VhG5So33ppznQhQuhWPvAFH4ZdGT8yKV/view?usp=sharing)

**Prototype Screenshots:**

---

## 📑 Table of Contents

1. Project Summary
2. Project Overview
3. Our Solution
4. Delivery Worker Persona
5. User Scenarios
6. Challenges Faced by Gig Workers
7. Application Workflow
8. Weekly Premium Model
9. Parametric Triggers
10. Platform Choice – Progressive Web App (PWA)
11. Tech Stack
12. System Architecture

---

## 📌 Project Summary

ShieldRider is an **AI-powered parametric insurance platform** built to protect gig delivery workers from sudden income loss caused by weather disruptions, pollution, strikes, or government restrictions.

The system continuously monitors environmental and operational data using external APIs. When predefined disruption thresholds are crossed, the platform automatically triggers insurance claims and sends payouts to affected workers.

The goal is to create an **affordable weekly micro-insurance system** that aligns with gig workers’ earning cycles and provides a reliable financial safety net.

---

## 🔎 Problem → Solution Overview

```
Gig Worker Reality Today
        |
        v
+-----------------------------+
| External Disruptions        |
| - Heavy Rain                |
| - Heat Waves                |
| - Pollution                 |
| - Strikes / Curfews         |
+--------------+--------------+
               |
               v
+-----------------------------+
| Delivery Orders Drop        |
| Workers Cannot Complete     |
| Enough Deliveries           |
+--------------+--------------+
               |
               v
+-----------------------------+
| Income Loss for Workers     |
| No Compensation Mechanism   |
+--------------+--------------+
               |
               v
=========== ShieldRider ==========
               |
               v
+-----------------------------+
| Parametric Insurance Model  |
| Detect Disruptions via APIs |
| Automatically Trigger Claim |
| Instant UPI Payout          |
+-----------------------------+
```

---

# 1. 🔵 Project Overview

## Problem Statement

Gig economy workers such as delivery riders depend heavily on daily orders for income. However, their earnings can drop significantly due to factors beyond their control such as heavy rain, extreme heat, air pollution, strikes, or traffic restrictions.

These disruptions directly affect the number of deliveries completed, resulting in unstable income and financial insecurity.

## Objective of the Solution

The objective of this project is to build a smart parametric insurance platform that protects gig workers from unexpected income loss.

The system automatically monitors environmental and operational conditions and provides compensation when predefined disruption triggers occur.

---

# 2. 🔵 Our Solution

ShieldRider is a digital platform that offers **affordable weekly micro-insurance** for gig workers.

The platform monitors real-time environmental and operational data such as weather conditions, air pollution levels, and city disruptions.

### Key Features

* Weekly micro-insurance plans for gig workers
* Automatic claim processing using parametric triggers
* Real-time monitoring of environmental and operational risks
* AI-driven risk prediction and premium adjustment
* Simple and accessible web-based platform

### ⚡ How ShieldRider is Different from Traditional Insurance

* **Automatic Claims:** No manual claim filing; payouts are triggered automatically.
* **Instant Payouts:** Compensation is processed within minutes.
* **Gig Worker Focused:** Weekly low-cost plans designed for delivery workers’ income patterns.
* **Real-Time Data Driven:** Uses live weather, AQI, and disruption data.
* **Covers Income Loss:** Protects against loss of daily earnings.
* **AI-Based Decisions:** Risk scoring, premium calculation, fraud detection.
* **Minimal Paperwork:** Fully digital system.

---

# 3. 🔵 Delivery Worker Persona — Example: Ravi

### Selected Delivery Segment

Food delivery services such as Zomato, Swiggy, and other gig-based delivery platforms.

### Persona Description

Ravi is a 27-year-old food delivery rider working in a busy metropolitan city.

He earns between **₹600 and ₹1000 per day** depending on demand and working conditions.

### Daily Workflow

* Logs into the delivery platform application
* Receives order notifications
* Picks up food from restaurants
* Delivers orders to customers
* Repeats the process throughout the day

### Income Loss Scenario

During severe rain or pollution events Ravi may complete far fewer deliveries, reducing income by **up to 50%**.

---

# 4. 🔵 User Scenarios

## Scenario 1 – Chennai Monsoon (Heavy Rainfall)

| Time     | Event                                          |
| -------- | ---------------------------------------------- |
| 11:17 AM | OpenWeatherMap API detects 67mm rainfall       |
| 11:18 AM | Trigger condition rainfall ≥ 40mm / 3 hrs TRUE |
| 11:19 AM | System identifies active policyholders         |
| 11:21 AM | AI fraud module confirms GPS location          |
| 11:23 AM | Fraud score 0.08 – auto approved               |
| 11:29 AM | ₹500 credited to Ravi’s UPI                    |

**Total time from trigger to payout: 12 minutes**

---

## Scenario 2 – Chennai Bandh (Social Disruption)

| Time    | Event                          |
| ------- | ------------------------------ |
| 6:45 AM | Civic alert feed detects bandh |
| 6:46 AM | Zones flagged as disrupted     |
| 6:48 AM | Policyholders identified       |
| 6:50 AM | Fraud check completed          |
| 6:55 AM | ₹500 credited                  |

---

## Scenario 3 – Hyderabad Heat Wave

| Time     | Event                       |
| -------- | --------------------------- |
| 12:10 PM | Heat index API reads 44°C   |
| 12:12 PM | Trigger heat index ≥ 42°C   |
| 12:14 PM | Partial disruption detected |
| 12:15 PM | Payout calculated ₹225      |
| 12:22 PM | ₹225 credited               |

---

# 5. 🔵 Challenges Faced by Gig Workers

| Disruption Type            | Avg. Days/Year | Daily Income Lost | Annual Exposure |
| -------------------------- | -------------- | ----------------- | --------------- |
| Heavy rainfall             | 18–22          | ₹600–900          | ₹11,000–19,800  |
| Extreme heat               | 8–12           | ₹300–500          | ₹2,400–6,000    |
| Strike                     | 3–6            | ₹600–900          | ₹1,800–5,400    |
| Flash flood / zone closure | 5–8            | ₹400–700          | ₹2,000–5,600    |

Workers face **8–20% annual income exposure** due to disruptions.

---

# 6. 🔵 Application Workflow

## Phase A – Worker Onboarding

1. Worker accesses the ShieldRider platform
2. OTP login using mobile number
3. Worker selects delivery platform and zone
4. AI calculates personalized premium
5. Worker selects plan and confirms payment
6. Policy activated

## Phase B – Automated Claims Engine

```
Worker Registers on ShieldRider
        |
        v
AI Calculates Risk Score
        |
        v
Weekly Micro‑Insurance Plan Activated
        |
        v
System Monitors Weather / Pollution / Alerts
        |
        v
Disruption Detected in Worker Zone
        |
        v
Parametric Trigger Activated
        |
        v
Fraud Detection Check
        |
        v
Automatic Payout Sent via UPI
```

---

# 7. 🔵 Weekly Premium Model

| Risk Level       | Weekly Premium | Maximum Weekly Coverage |
| ---------------- | -------------- | ----------------------- |
| Low Risk Area    | ₹20            | ₹500                    |
| Medium Risk Area | ₹35            | ₹700                    |
| High Risk Area   | ₹50            | ₹1000                   |

Risk level determined using:

* Historical weather data
* Flood-prone zones
* Pollution levels
* Frequency of disruptions

---

# 8. 🔵 Parametric Triggers

## Parametric Insurance Concept

```
Traditional Insurance
Worker files claim
        |
        v
Manual verification
        |
        v
Approval after days/weeks

ShieldRider Parametric Insurance
External Data Trigger
        |
        v
System Detects Event
        |
        v
Automatic Claim Generation
        |
        v
Instant UPI Payout
```

### Weather Triggers

* Rainfall > 50mm
* Extreme heat > 42°C

### Pollution Triggers

* AQI above 400

### Social Triggers

* Strikes
* Curfews
* Zone closures

## Parametric Trigger Logic Flow

```
External Data APIs
        |
        v
Trigger Monitoring Engine
        |
        v
Check Threshold Conditions
        |
        v
Trigger TRUE?
      /      \
    No        Yes
    |          |
    v          v
Continue   Identify Policies
Monitoring
```

---

# 9. 🔵 Platform Choice — Progressive Web App (PWA)

Benefits:

* No app download required
* Works on Android and iOS
* Push notifications
* Offline capabilities

---

# 10. ⚙ Tech Stack

## Frontend

* HTML
* CSS
* JavaScript
* React

## Backend

* Python (Flask / FastAPI)
* Node.js (Express)

## Machine Learning

* Logistic Regression
* Random Forest
* Isolation Forest

## Database

* Firebase / MongoDB

---

# 11. 🔵 System Architecture

## Clean Architecture Diagram

```
graph TD
A[Worker Mobile Browser / PWA] --> B[Frontend Web App]
B --> C[Backend API Layer]
C --> D[Policy & Claims Manager]
C --> E[AI Risk Prediction Engine]
C --> F[Fraud Detection Engine]
E --> G[Risk Score Calculation]
F --> H[Anomaly Detection]
C --> I[External APIs]
D --> M[Payout Engine]
M --> N[UPI / Payment Gateway]
```

## ASCII Architecture Diagram

```
        +-------------------+
        |   Worker (User)   |
        +---------+---------+
                  |
                  v
        +-------------------+
        |  Web App (React)  |
        +---------+---------+
                  |
                  v
        +-----------------------------+
        |        Backend API          |
        +-----+-----------+-----------+
              |           |
              v           v
     +---------------+   +------------------+
     |  AI Risk      |   | Fraud Detection  |
     |  Engine       |   | Engine           |
     +-------+-------+   +--------+---------+
             |                    |
             v                    v
       +----------------------------------+
       |      Policy & Claims Manager     |
       +----------------+-----------------+
                        |
                        v
               +-------------------+
               | Payout System     |
               | (UPI / Sandbox)   |
               +-------------------+
```

This architecture allows the platform to monitor disruptions, evaluate risk using AI models, and automatically trigger payouts when disruption conditions are met.
