# Epilogue Monetization Strategy

> iOS app for physical book readers with AI chat, quote capture, and ambient voice mode.

---

## Executive Summary

Epilogue sits at the intersection of two proven markets: **book tracking apps** ($5-50/year) and **AI assistant apps** ($20/month). This unique positioning allows premium pricing above typical reading apps while delivering clear value through AI-powered features that justify the cost.

**Recommended pricing:**
- **Free tier**: Generous library + limited AI
- **Pro tier**: $6.99/month or $49.99/year (40% annual discount)
- **No higher tier** initially—keep it simple

---

## Market Research

### Reading App Benchmarks

| App | Free Tier | Premium Price | Key Features |
|-----|-----------|---------------|--------------|
| **Goodreads** | Full access | Free | Social, reviews, tracking |
| **Libby** | Full access | Free (library) | Ebook/audiobook access |
| **StoryGraph** | Robust | $5/mo or $49/yr | Advanced analytics, mood tracking |
| **Bookly** | Limited | $29.99/year | Habit building, reading timer |
| **Fable** | Basic | $5.99/mo or $69.99/yr | Book clubs, advanced tracking |
| **Oku** | Limited | $6-15/month | Modern UI, social features |

**Insight**: Book tracking apps cluster around **$5-7/month** or **$30-70/year**. Users expect robust free tiers for basic tracking.

### AI App Benchmarks

| App | Free Tier | Premium Price | Model |
|-----|-----------|---------------|-------|
| **ChatGPT** | GPT-4o limited | $20/month | Unlimited GPT-4o |
| **Claude** | Limited usage | $20/month | Higher limits |
| **Notion AI** | None | +$10/user/month | Add-on to existing plan |
| **Canva Magic** | Limited | Bundled in Pro | Part of $12.99/mo plan |

**Insight**: Standalone AI apps charge **$20/month**, but AI as a *feature* within apps typically adds **$5-10/month** to base pricing.

### Key Learnings

1. **Freemium conversion**: 3-10% is typical; AI apps often see higher conversion due to clear value demonstration
2. **Annual discounts**: 30-40% off monthly is standard; increases LTV significantly
3. **Token economics**: AI features cost real money—free tiers must limit usage to control costs
4. **Soft > Hard paywalls**: Let users experience value before asking for payment

---

## Tier Structure

### Free Tier: "Reader"

**Philosophy**: Make the core reading companion experience excellent. Let users fall in love with the app before encountering limits.

| Feature | Access | Limit |
|---------|--------|-------|
| Library management | ✅ Full | Unlimited books |
| Book search & add | ✅ Full | — |
| Reading status tracking | ✅ Full | — |
| Quote capture (OCR) | ✅ Full | **10 quotes/month** |
| Quote card export | ⚠️ Limited | Watermarked, 3/month |
| AI chat | ⚠️ Limited | **15 messages/month** |
| Ambient voice mode | ❌ Locked | Pro only |
| Theme detection | ⚠️ Limited | 1 book/month |
| Reading analytics | ⚠️ Basic | Current year only |
| iCloud sync | ✅ Full | — |

**Rationale**:
- Library management is table stakes—must be unlimited to compete with Goodreads
- Quote capture is the hook—10/month is enough to demonstrate value but not enough for power users
- AI chat limit (15 messages) costs ~$0.15-0.30/user/month in tokens—acceptable for acquisition
- Ambient voice is high-cost, high-value—perfect upsell feature

### Pro Tier: $6.99/month or $49.99/year

**Philosophy**: Remove all friction for serious readers. The price point is deliberately below the "AI app" mental model ($20) but above basic book trackers ($3-5).

| Feature | Access |
|---------|--------|
| Library management | ✅ Full |
| Quote capture (OCR) | ✅ **Unlimited** |
| Quote card export | ✅ **No watermark, unlimited** |
| AI chat | ✅ **200 messages/month** |
| Ambient voice mode | ✅ **Unlocked** (60 min/month) |
| Theme detection | ✅ **Unlimited books** |
| Reading analytics | ✅ **Full history + insights** |
| Export data | ✅ CSV, JSON |
| Priority support | ✅ 24-hour response |
| Early access | ✅ Beta features |

**Why not higher AI limits?**
- 200 messages/month = ~$2-4 in Claude API costs at current rates
- This is sustainable at $6.99/month after Apple's 30% cut ($4.89 net)
- Power users who hit limits are rare; they become your advocates

**Why $6.99 and not $9.99?**
- Price sensitivity research shows $6.99 is a psychological threshold
- Competes directly with StoryGraph, Fable, Oku
- Annual at $49.99 ($4.17/month effective) is highly competitive

### Why No "Ultra" Tier?

Considered but rejected:
- **Complexity kills conversion**: Two choices (free/pro) convert better than three
- **Marginal value unclear**: What would Ultra offer? More AI? Users don't need 1000 messages/month
- **Operational overhead**: More SKUs = more support, more edge cases
- **Future option**: Can always add later based on demand signals

---

## Feature Gating Strategy

### Detailed Breakdown

#### Library Management — FREE
- **Why free**: This is the core value prop. Locking it would kill retention.
- **Implementation**: No limits on books, shelves, tags, or organization
- **Upsell opportunity**: None—this builds habit and trust

#### Quote Capture (OCR) — METERED FREE
- **Why metered**: OCR is cheap (~$0.001/image) but quote capture is the "magic moment"
- **Free limit**: 10 quotes/month—enough to capture favorite passages from 2-3 books
- **Pro unlock**: Unlimited captures
- **UX**: Soft limit with counter ("7 of 10 captures used this month")

#### Quote Card Export — LIMITED FREE
- **Why limited**: Export is shareable—watermark drives organic growth
- **Free version**: Small "Made with Epilogue" watermark, 3 exports/month
- **Pro version**: Clean exports, custom themes, unlimited
- **Implementation**: Watermark should be tasteful, not obnoxious

#### AI Chat — METERED FREE
- **Why metered**: AI tokens cost real money; must control costs
- **Free limit**: 15 messages/month (~3-5 conversations)
- **Pro limit**: 200 messages/month
- **Token management**:
  - Use Claude Haiku for free tier (cheaper)
  - Use Claude Sonnet for Pro tier (better quality)
- **Reset**: Monthly, rolling 30-day window
- **UX**: Show remaining messages, offer upgrade at 0

#### Ambient Voice Mode — PRO ONLY
- **Why locked**: Voice synthesis is expensive (~$0.015/1K characters)
- **Implementation**: Hard lock with preview/demo option (30-second sample)
- **Pro limit**: 60 minutes/month of voice synthesis
- **Upsell trigger**: "Hear your book insights while you walk"

#### Theme Detection & Insights — METERED FREE
- **Why metered**: Uses AI for analysis—has token cost
- **Free limit**: 1 book analysis/month
- **Pro unlock**: Unlimited analyses
- **Value demo**: Free analysis shows the magic; users want more

#### Reading Analytics — TIERED FREE
- **Why tiered**: Analytics are cheap to compute; good for engagement
- **Free version**: Current year stats, basic charts
- **Pro version**: Full history, trends, reading speed, genre breakdown, yearly comparisons

---

## Paywall Strategy

### Placement Recommendations

#### 1. Feature-Triggered Paywalls (Primary)
Show paywall when user tries to access locked features:

```
User taps "Ambient Voice" → Paywall with voice demo
User hits quote limit → Paywall highlighting unlimited captures
User tries watermark-free export → Paywall showing clean preview
```

**Design**: Full-screen modal with:
- Feature preview/demo
- Clear benefit statement
- Price with annual savings highlighted
- "Maybe Later" option (not "No Thanks")

#### 2. Limit-Reached Paywalls (Secondary)
Triggered when metered features hit zero:

```
"You've used all 15 AI chats this month"
→ Show value received: "You discussed 3 books and discovered 5 new titles"
→ Upgrade CTA: "Get 200 chats/month with Pro"
→ Alternative: "Resets in X days" (reduces pressure)
```

#### 3. Value-Moment Paywalls (Tertiary)
Show after positive experiences:

```
After completing a book: "Congrats! Unlock reading insights?"
After first AI chat: "Love discussing books? Get unlimited chats"
After week of daily use: "You're a power reader—upgrade for more"
```

### Paywall DON'Ts
- ❌ Don't paywall library features—feels punitive
- ❌ Don't show paywall on first launch—no value demonstrated yet
- ❌ Don't show paywall more than once per session
- ❌ Don't use "countdown timers" or fake urgency
- ❌ Don't disable features users previously had access to

### Conversion Optimization

**A/B test these elements:**
- Price anchoring (show monthly vs annual first)
- Social proof ("Join 10,000 readers")
- Feature emphasis (voice vs quotes vs AI)
- CTA copy ("Start Pro" vs "Upgrade Now")

---

## Trial Strategy

### Recommended: 7-Day Free Trial

**Why 7 days:**
- Long enough to demonstrate AI value (multiple conversations)
- Short enough to create urgency
- Industry standard for subscription apps
- Allows users to experience ambient voice and full analytics

**Implementation:**
- Trial starts on first Pro feature attempt, not on signup
- Full Pro access during trial
- Daily reminder of trial status (subtle, not annoying)
- Day 5-6: Soft reminder of what they'll lose
- Day 7: Clear "Subscribe to keep Pro" message

### Alternative: No Trial, Generous Free Tier

**Argument for this approach:**
- Free tier is already generous—demonstrates value
- No "trial anxiety" for users
- Cleaner conversion funnel
- Lower support burden

**Recommendation**: Start with no trial; add 7-day trial if conversion is below 5% after 3 months.

---

## Family Sharing

### Recommendation: Enable Family Sharing

**Why:**
- Books are often shared/discussed in families
- Increases household LTV
- Differentiator from competitors
- Apple promotes Family Sharing-enabled apps

**Implementation considerations:**
- AI limits are per-subscription, not per-user
  - 200 messages/month shared across family
  - Prevents abuse while enabling sharing
- Each family member gets separate library
- Analytics are individual

**Pricing impact:**
- Family Sharing may reduce revenue ~10-20%
- Offset by increased adoption and reduced churn
- Consider Family Sharing as marketing expense

---

## Pricing Psychology

### Why $6.99/month

| Price Point | Perception | Risk |
|-------------|------------|------|
| $4.99 | "Cheap" | Undervalues AI features |
| **$6.99** | "Fair" | Sweet spot for book + AI |
| $9.99 | "Expensive" | Competes with ChatGPT |
| $12.99 | "Premium" | Hard to justify for single-purpose app |

### Why $49.99/year

- **Effective monthly**: $4.17 (40% discount from $6.99)
- **Psychology**: Under $50 threshold
- **Comparison**: Cheaper than 1 hardcover book/month
- **Competitor parity**: StoryGraph $49, Fable $49-70

### Annual vs Monthly

**Promote annual heavily:**
- 70-80% of revenue should come from annual
- Show monthly first, then annual with "Save 40%" badge
- Default selection: Annual (but allow easy switch)

---

## Cost Modeling

### Per-User Costs (Pro Tier)

| Cost Item | Monthly Estimate | Notes |
|-----------|------------------|-------|
| Claude API (AI chat) | $2.50 | ~200 msgs × $0.0125 avg |
| Claude API (themes) | $0.50 | ~5 analyses × $0.10 |
| Voice synthesis | $1.50 | ~60 min × $0.025/min |
| OCR processing | $0.10 | Negligible |
| **Total variable** | **$4.60** | |

### Revenue Math

| Metric | Monthly | Annual |
|--------|---------|--------|
| Price | $6.99 | $49.99 |
| Apple cut (30%) | -$2.10 | -$15.00 |
| **Net revenue** | **$4.89** | **$34.99** |
| Variable costs | -$4.60 | -$55.20 |
| **Margin** | **$0.29** | **-$20.21** |

**Problem**: At full usage, Pro is unprofitable on annual plans.

### Solutions

1. **Most users don't hit limits**: Average usage is typically 30-50% of limits
   - Realistic monthly cost: ~$2.00/user
   - Realistic margin: $2.89/month or $22.99/year

2. **Tiered API usage**:
   - Use Haiku for simple queries (50% cheaper)
   - Reserve Sonnet for complex discussions

3. **Caching**:
   - Cache book metadata, common theme analyses
   - Reduces redundant API calls by 30-40%

4. **Adjust limits if needed**:
   - Monitor actual usage after launch
   - Adjust Pro limits based on data (150 messages, 45 min voice)

---

## Launch Strategy

### Phase 1: Soft Launch (Months 1-2)
- Free tier only
- Gather usage data
- Build user base and reviews
- No paywall—pure product validation

### Phase 2: Pro Introduction (Month 3)
- Introduce Pro tier
- Offer founding member pricing ($39.99/year first 1000 users)
- Heavy trial promotion
- Monitor conversion and churn

### Phase 3: Optimization (Months 4-6)
- A/B test paywalls
- Adjust limits based on usage data
- Introduce seasonal promotions
- Consider annual-only pricing if monthly churn is high

---

## Success Metrics

### Target KPIs

| Metric | Target | Industry Benchmark |
|--------|--------|-------------------|
| Free → Trial conversion | 15-25% | 10-20% |
| Trial → Paid conversion | 40-60% | 30-50% |
| Overall free → paid | 5-8% | 3-5% |
| Monthly churn | <5% | 5-10% |
| Annual retention | >70% | 60-70% |
| ARPU (monthly) | $0.50-0.80 | Varies widely |

### Tracking Requirements

- Paywall impression → conversion funnel
- Feature usage by tier
- AI token consumption per user
- Limit hit frequency
- Upgrade trigger analysis

---

## Competitive Positioning

```
                    AI Features
                         ↑
                         |
          Epilogue Pro   |   ChatGPT
              ●          |      ●
                         |
    ←────────────────────┼────────────────────→ Price
     $5                  |                 $20
                         |
         StoryGraph ●    |
         Bookly ●        |
                         |
                    Book Features
```

**Epilogue's position**: More AI than any book app, more book-focused than any AI app. The only app where you can discuss what you're reading with an AI that understands your library.

---

## Appendix: Rejected Ideas

### Why Not Ads?
- Book readers are premium audience—ads feel wrong
- Ad revenue per user is minimal ($0.50-2/month)
- Damages brand perception
- Subscription alignment with user interests is cleaner

### Why Not Lifetime Purchase?
- AI costs are ongoing—lifetime is unsustainable
- Creates two-class user base
- Limits future feature pricing
- Exception: Could offer lifetime at $199 for early adopters (covers ~5 years of costs)

### Why Not Usage-Based Pricing?
- Unpredictable costs stress users
- Discourages feature exploration
- Complex to communicate
- Works for APIs, not consumer apps

---

## Sources

- [Best Book Tracker Apps 2025](https://bestbooktracker.com/best-book-tracker-apps-2025.html)
- [Claude Pricing Plans](https://claude.com/pricing)
- [AI App Revenue Models](https://www.gptwrapperapps.com/blog/ai-app-revenue-models-2025)
- [RevenueCat: AI Subscription Pricing](https://www.revenuecat.com/blog/growth/ai-subscription-app-pricing/)
- [StoreKit Views Guide](https://www.revenuecat.com/blog/engineering/storekit-views-guide-paywall-swift-ui/)
- [iOS Paywall Design Guide](https://adapty.io/blog/how-to-design-ios-paywall/)
- [Superwall: StoreKit 2 Tutorial](https://superwall.com/blog/make-a-swiftui-app-with-in-app-purchases-and-storekit-2/)
