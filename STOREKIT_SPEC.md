# Epilogue StoreKit 2 Technical Specification

> Implementation guide for iOS subscription management using StoreKit 2 and SwiftUI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  PaywallView   │  SettingsView  │  FeatureGates  │  UsageTracker │
└───────┬────────┴───────┬────────┴───────┬────────┴───────┬───────┘
        │                │                │                │
        └────────────────┴────────────────┴────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   SubscriptionManager   │
                    │   (ObservableObject)    │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
   ┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
   │  StoreKit 2 API │  │  UsageService   │  │  EntitlementDB │
   │  (Product,      │  │  (Token counts, │  │  (Local cache) │
   │   Transaction)  │  │   limits, sync) │  │                │
   └─────────────────┘  └─────────────────┘  └────────────────┘
```

---

## Product Configuration

### App Store Connect Setup

```swift
// Product Identifiers (configure in App Store Connect)
enum ProductID: String, CaseIterable {
    // Subscriptions
    case proMonthly = "com.epilogue.pro.monthly"
    case proAnnual = "com.epilogue.pro.annual"

    // Subscription Group: "Epilogue Pro" (group ID in ASC)
    static let subscriptionGroupID = "21234567"
}
```

### StoreKit Configuration File

Create `Products.storekit` for local testing:

```json
{
  "identifier": "com.epilogue.products",
  "products": [
    {
      "displayPrice": "6.99",
      "familyShareable": true,
      "internalID": "pro_monthly",
      "localizations": [
        {
          "description": "Unlimited quotes, AI chat, voice mode",
          "displayName": "Epilogue Pro Monthly",
          "locale": "en_US"
        }
      ],
      "productID": "com.epilogue.pro.monthly",
      "recurringSubscriptionPeriod": "P1M",
      "type": "RecurringSubscription",
      "subscriptionGroupID": "21234567"
    },
    {
      "displayPrice": "49.99",
      "familyShareable": true,
      "internalID": "pro_annual",
      "localizations": [
        {
          "description": "Unlimited quotes, AI chat, voice mode",
          "displayName": "Epilogue Pro Annual",
          "locale": "en_US"
        }
      ],
      "productID": "com.epilogue.pro.annual",
      "recurringSubscriptionPeriod": "P1Y",
      "type": "RecurringSubscription",
      "subscriptionGroupID": "21234567",
      "introductoryOffer": {
        "internalID": "7_day_trial",
        "paymentMode": "freeTrial",
        "subscriptionPeriod": "P1W"
      }
    }
  ],
  "settings": {
    "askToBuyEnabled": false,
    "billingGracePeriod": "P16D"
  }
}
```

---

## Core Implementation

### SubscriptionManager

```swift
import StoreKit
import SwiftUI

@MainActor
final class SubscriptionManager: ObservableObject {

    // MARK: - Published State

    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    @Published private(set) var subscriptionStatus: SubscriptionStatus = .none
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    // MARK: - Computed Properties

    var isPro: Bool {
        subscriptionStatus == .subscribed || subscriptionStatus == .inTrial
    }

    var isInTrial: Bool {
        subscriptionStatus == .inTrial
    }

    var trialDaysRemaining: Int? {
        guard case .inTrial = subscriptionStatus,
              let renewal = currentRenewalInfo,
              let expirationDate = renewal.expirationDate else {
            return nil
        }
        return Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day
    }

    // MARK: - Private State

    private var updateListenerTask: Task<Void, Error>?
    private var currentRenewalInfo: Product.SubscriptionInfo.RenewalInfo?
    private let productIDs = ProductID.allCases.map(\.rawValue)

    // MARK: - Lifecycle

    init() {
        updateListenerTask = listenForTransactions()
        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Product Loading

    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }

        do {
            products = try await Product.products(for: productIDs)
                .sorted { $0.price < $1.price }
        } catch {
            errorMessage = "Failed to load products: \(error.localizedDescription)"
        }
    }

    // MARK: - Purchase

    func purchase(_ product: Product) async throws -> Transaction? {
        isLoading = true
        defer { isLoading = false }

        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updateSubscriptionStatus()
            await transaction.finish()
            return transaction

        case .userCancelled:
            return nil

        case .pending:
            // Transaction pending approval (Ask to Buy, etc.)
            return nil

        @unknown default:
            return nil
        }
    }

    // MARK: - Restore Purchases

    func restorePurchases() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
        } catch {
            errorMessage = "Failed to restore purchases: \(error.localizedDescription)"
        }
    }

    // MARK: - Subscription Status

    func updateSubscriptionStatus() async {
        var foundSubscription = false

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }

            if productIDs.contains(transaction.productID) {
                purchasedProductIDs.insert(transaction.productID)
                foundSubscription = true

                // Check for trial status
                if let product = products.first(where: { $0.id == transaction.productID }),
                   let subscription = product.subscription {

                    if let status = try? await subscription.status.first {
                        switch status.state {
                        case .subscribed:
                            if let renewalInfo = try? status.renewalInfo.payloadValue,
                               renewalInfo.offerType == .introductory {
                                subscriptionStatus = .inTrial
                                currentRenewalInfo = renewalInfo
                            } else {
                                subscriptionStatus = .subscribed
                            }
                        case .expired:
                            subscriptionStatus = .expired
                        case .inBillingRetryPeriod:
                            subscriptionStatus = .billingRetry
                        case .inGracePeriod:
                            subscriptionStatus = .gracePeriod
                        case .revoked:
                            subscriptionStatus = .revoked
                        default:
                            break
                        }
                    }
                }
            }
        }

        if !foundSubscription {
            purchasedProductIDs.removeAll()
            subscriptionStatus = .none
        }
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { break }

                do {
                    let transaction = try await self.checkVerified(result)
                    await self.updateSubscriptionStatus()
                    await transaction.finish()
                } catch {
                    // Log verification failure
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }

    // MARK: - Verification

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }
}

// MARK: - Subscription Status Enum

enum SubscriptionStatus: Equatable {
    case none
    case inTrial
    case subscribed
    case expired
    case billingRetry
    case gracePeriod
    case revoked
}
```

---

## Usage Tracking

### UsageManager

```swift
import Foundation
import SwiftUI

@MainActor
final class UsageManager: ObservableObject {

    // MARK: - Published State

    @Published private(set) var aiMessagesUsed: Int = 0
    @Published private(set) var quotesCaputuredThisMonth: Int = 0
    @Published private(set) var voiceMinutesUsed: Int = 0
    @Published private(set) var themeAnalysesUsed: Int = 0
    @Published private(set) var quoteExportsUsed: Int = 0

    // MARK: - Limits

    struct Limits {
        // Free tier limits
        static let freeAIMessages = 15
        static let freeQuoteCaptures = 10
        static let freeThemeAnalyses = 1
        static let freeQuoteExports = 3

        // Pro tier limits
        static let proAIMessages = 200
        static let proVoiceMinutes = 60
        static let proQuoteCaptures = Int.max
        static let proThemeAnalyses = Int.max
        static let proQuoteExports = Int.max
    }

    // MARK: - Computed Properties

    var aiMessagesRemaining: Int {
        let limit = isPro ? Limits.proAIMessages : Limits.freeAIMessages
        return max(0, limit - aiMessagesUsed)
    }

    var quoteCapturesRemaining: Int {
        let limit = isPro ? Limits.proQuoteCaptures : Limits.freeQuoteCaptures
        return max(0, limit - quotesCaputuredThisMonth)
    }

    var voiceMinutesRemaining: Int {
        guard isPro else { return 0 }
        return max(0, Limits.proVoiceMinutes - voiceMinutesUsed)
    }

    var canUseAI: Bool { aiMessagesRemaining > 0 }
    var canCaptureQuote: Bool { quoteCapturesRemaining > 0 }
    var canUseVoice: Bool { isPro && voiceMinutesRemaining > 0 }
    var canAnalyzeTheme: Bool { isPro || themeAnalysesUsed < Limits.freeThemeAnalyses }
    var canExportQuote: Bool { isPro || quoteExportsUsed < Limits.freeQuoteExports }

    // MARK: - Dependencies

    private let subscriptionManager: SubscriptionManager
    private let storage: UsageStorage

    private var isPro: Bool { subscriptionManager.isPro }

    // MARK: - Initialization

    init(subscriptionManager: SubscriptionManager, storage: UsageStorage = .shared) {
        self.subscriptionManager = subscriptionManager
        self.storage = storage
        loadUsage()
        checkAndResetIfNewMonth()
    }

    // MARK: - Usage Recording

    func recordAIMessage() {
        aiMessagesUsed += 1
        saveUsage()
    }

    func recordQuoteCapture() {
        quotesCaputuredThisMonth += 1
        saveUsage()
    }

    func recordVoiceMinutes(_ minutes: Int) {
        voiceMinutesUsed += minutes
        saveUsage()
    }

    func recordThemeAnalysis() {
        themeAnalysesUsed += 1
        saveUsage()
    }

    func recordQuoteExport() {
        quoteExportsUsed += 1
        saveUsage()
    }

    // MARK: - Reset Logic

    private func checkAndResetIfNewMonth() {
        let calendar = Calendar.current
        let now = Date()

        if let lastReset = storage.lastResetDate,
           !calendar.isDate(lastReset, equalTo: now, toGranularity: .month) {
            resetMonthlyUsage()
        }
    }

    private func resetMonthlyUsage() {
        aiMessagesUsed = 0
        quotesCaputuredThisMonth = 0
        voiceMinutesUsed = 0
        themeAnalysesUsed = 0
        quoteExportsUsed = 0
        storage.lastResetDate = Date()
        saveUsage()
    }

    // MARK: - Persistence

    private func loadUsage() {
        aiMessagesUsed = storage.aiMessagesUsed
        quotesCaputuredThisMonth = storage.quoteCapturesUsed
        voiceMinutesUsed = storage.voiceMinutesUsed
        themeAnalysesUsed = storage.themeAnalysesUsed
        quoteExportsUsed = storage.quoteExportsUsed
    }

    private func saveUsage() {
        storage.aiMessagesUsed = aiMessagesUsed
        storage.quoteCapturesUsed = quotesCaputuredThisMonth
        storage.voiceMinutesUsed = voiceMinutesUsed
        storage.themeAnalysesUsed = themeAnalysesUsed
        storage.quoteExportsUsed = quoteExportsUsed
    }
}

// MARK: - Usage Storage

final class UsageStorage {
    static let shared = UsageStorage()

    private let defaults = UserDefaults.standard
    private let suite = "com.epilogue.usage"

    var aiMessagesUsed: Int {
        get { defaults.integer(forKey: "\(suite).aiMessages") }
        set { defaults.set(newValue, forKey: "\(suite).aiMessages") }
    }

    var quoteCapturesUsed: Int {
        get { defaults.integer(forKey: "\(suite).quoteCaptures") }
        set { defaults.set(newValue, forKey: "\(suite).quoteCaptures") }
    }

    var voiceMinutesUsed: Int {
        get { defaults.integer(forKey: "\(suite).voiceMinutes") }
        set { defaults.set(newValue, forKey: "\(suite).voiceMinutes") }
    }

    var themeAnalysesUsed: Int {
        get { defaults.integer(forKey: "\(suite).themeAnalyses") }
        set { defaults.set(newValue, forKey: "\(suite).themeAnalyses") }
    }

    var quoteExportsUsed: Int {
        get { defaults.integer(forKey: "\(suite).quoteExports") }
        set { defaults.set(newValue, forKey: "\(suite).quoteExports") }
    }

    var lastResetDate: Date? {
        get { defaults.object(forKey: "\(suite).lastReset") as? Date }
        set { defaults.set(newValue, forKey: "\(suite).lastReset") }
    }
}
```

---

## Feature Gating

### FeatureGate

```swift
import SwiftUI

// MARK: - Feature Enum

enum Feature: String, CaseIterable {
    case unlimitedQuotes
    case watermarkFreeExport
    case unlimitedAI
    case ambientVoice
    case fullAnalytics
    case unlimitedThemes
    case prioritySupport
    case earlyAccess

    var requiresPro: Bool {
        switch self {
        case .ambientVoice, .prioritySupport, .earlyAccess:
            return true // Hard paywall
        case .unlimitedQuotes, .watermarkFreeExport, .unlimitedAI,
             .fullAnalytics, .unlimitedThemes:
            return false // Metered or partial free access
        }
    }

    var displayName: String {
        switch self {
        case .unlimitedQuotes: return "Unlimited Quote Capture"
        case .watermarkFreeExport: return "Watermark-Free Exports"
        case .unlimitedAI: return "Unlimited AI Chat"
        case .ambientVoice: return "Ambient Voice Mode"
        case .fullAnalytics: return "Full Reading Analytics"
        case .unlimitedThemes: return "Unlimited Theme Analysis"
        case .prioritySupport: return "Priority Support"
        case .earlyAccess: return "Early Access to Features"
        }
    }

    var description: String {
        switch self {
        case .unlimitedQuotes:
            return "Capture every meaningful passage without limits"
        case .watermarkFreeExport:
            return "Share beautiful quote cards without branding"
        case .unlimitedAI:
            return "Discuss your books with AI anytime"
        case .ambientVoice:
            return "Listen to book insights and discussions"
        case .fullAnalytics:
            return "Track your reading journey with detailed stats"
        case .unlimitedThemes:
            return "Discover themes in every book you read"
        case .prioritySupport:
            return "Get help within 24 hours"
        case .earlyAccess:
            return "Try new features before anyone else"
        }
    }

    var iconName: String {
        switch self {
        case .unlimitedQuotes: return "quote.bubble.fill"
        case .watermarkFreeExport: return "square.and.arrow.up.fill"
        case .unlimitedAI: return "bubble.left.and.bubble.right.fill"
        case .ambientVoice: return "waveform.circle.fill"
        case .fullAnalytics: return "chart.bar.fill"
        case .unlimitedThemes: return "sparkles"
        case .prioritySupport: return "person.fill.questionmark"
        case .earlyAccess: return "star.fill"
        }
    }
}

// MARK: - Feature Gate View Modifier

struct FeatureGateModifier: ViewModifier {
    let feature: Feature
    let action: () -> Void

    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @EnvironmentObject var usageManager: UsageManager
    @State private var showPaywall = false

    func body(content: Content) -> some View {
        content
            .onTapGesture {
                if canAccess {
                    action()
                } else {
                    showPaywall = true
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView(highlightedFeature: feature)
            }
    }

    private var canAccess: Bool {
        if subscriptionManager.isPro { return true }

        switch feature {
        case .unlimitedQuotes:
            return usageManager.canCaptureQuote
        case .unlimitedAI:
            return usageManager.canUseAI
        case .unlimitedThemes:
            return usageManager.canAnalyzeTheme
        case .watermarkFreeExport:
            return usageManager.canExportQuote
        case .ambientVoice, .fullAnalytics, .prioritySupport, .earlyAccess:
            return false
        }
    }
}

extension View {
    func gated(for feature: Feature, action: @escaping () -> Void) -> some View {
        modifier(FeatureGateModifier(feature: feature, action: action))
    }
}

// MARK: - Usage Example

/*
 Button("Capture Quote") { }
     .gated(for: .unlimitedQuotes) {
         viewModel.captureQuote()
     }
 */
```

---

## Paywall UI

### PaywallView

```swift
import SwiftUI
import StoreKit

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var subscriptionManager: SubscriptionManager

    let highlightedFeature: Feature?

    @State private var selectedProduct: Product?
    @State private var isPurchasing = false
    @State private var errorMessage: String?

    init(highlightedFeature: Feature? = nil) {
        self.highlightedFeature = highlightedFeature
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    headerSection
                    featuresSection
                    pricingSection
                    legalSection
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Maybe Later") { dismiss() }
                        .foregroundStyle(.secondary)
                }
            }
            .alert("Purchase Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "book.pages.fill")
                .font(.system(size: 60))
                .foregroundStyle(.linearGradient(
                    colors: [.orange, .pink],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))

            Text("Upgrade to Pro")
                .font(.largeTitle)
                .fontWeight(.bold)

            if let feature = highlightedFeature {
                Text("Unlock \(feature.displayName.lowercased()) and more")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            } else {
                Text("The complete reading companion experience")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    // MARK: - Features

    private var featuresSection: some View {
        VStack(spacing: 16) {
            ForEach(Feature.allCases, id: \.rawValue) { feature in
                FeatureRow(
                    feature: feature,
                    isHighlighted: feature == highlightedFeature
                )
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pricing

    private var pricingSection: some View {
        VStack(spacing: 16) {
            ForEach(subscriptionManager.products, id: \.id) { product in
                ProductCard(
                    product: product,
                    isSelected: selectedProduct?.id == product.id,
                    onSelect: { selectedProduct = product }
                )
            }

            purchaseButton

            restoreButton
        }
    }

    private var purchaseButton: some View {
        Button {
            Task { await purchase() }
        } label: {
            Group {
                if isPurchasing {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text(selectedProduct == nil ? "Select a Plan" : "Start Free Trial")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
        }
        .buttonStyle(.borderedProminent)
        .disabled(selectedProduct == nil || isPurchasing)
    }

    private var restoreButton: some View {
        Button("Restore Purchases") {
            Task { await subscriptionManager.restorePurchases() }
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
    }

    // MARK: - Legal

    private var legalSection: some View {
        VStack(spacing: 8) {
            Text("Cancel anytime. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            HStack(spacing: 16) {
                Link("Terms of Service", destination: URL(string: "https://epilogue.app/terms")!)
                Link("Privacy Policy", destination: URL(string: "https://epilogue.app/privacy")!)
            }
            .font(.caption)
        }
    }

    // MARK: - Actions

    private func purchase() async {
        guard let product = selectedProduct else { return }

        isPurchasing = true
        defer { isPurchasing = false }

        do {
            if let _ = try await subscriptionManager.purchase(product) {
                dismiss()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    let feature: Feature
    let isHighlighted: Bool

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: feature.iconName)
                .font(.title2)
                .foregroundStyle(isHighlighted ? .orange : .primary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(feature.displayName)
                    .fontWeight(isHighlighted ? .semibold : .regular)

                Text(feature.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
        }
        .padding(.vertical, 4)
        .background(isHighlighted ? Color.orange.opacity(0.1) : .clear)
        .cornerRadius(8)
    }
}

// MARK: - Product Card

struct ProductCard: View {
    let product: Product
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(product.displayName)
                            .fontWeight(.semibold)

                        if isAnnual {
                            Text("SAVE 40%")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.orange)
                                .foregroundStyle(.white)
                                .cornerRadius(4)
                        }
                    }

                    if isAnnual {
                        Text("\(monthlyEquivalent)/month")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if hasTrial {
                        Text("7-day free trial")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                }

                Spacer()

                Text(product.displayPrice)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.accentColor : Color.secondary.opacity(0.3), lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var isAnnual: Bool {
        product.id.contains("annual")
    }

    private var hasTrial: Bool {
        product.subscription?.introductoryOffer != nil
    }

    private var monthlyEquivalent: String {
        let yearly = product.price
        let monthly = yearly / 12
        return monthly.formatted(.currency(code: product.priceFormatStyle.currencyCode ?? "USD"))
    }
}
```

---

## iOS 17+ StoreKit Views Alternative

For simpler implementation using Apple's built-in paywall views:

```swift
import SwiftUI
import StoreKit

struct SimplePaywallView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        SubscriptionStoreView(groupID: ProductID.subscriptionGroupID) {
            VStack(spacing: 16) {
                Image(systemName: "book.pages.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.orange)

                Text("Epilogue Pro")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Unlimited quotes, AI chat, and voice mode")
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
        .subscriptionStoreControlStyle(.prominentPicker)
        .subscriptionStoreButtonLabel(.multiline)
        .storeButton(.visible, for: .restorePurchases)
        .onInAppPurchaseCompletion { product, result in
            if case .success(.success(_)) = result {
                dismiss()
            }
        }
    }
}
```

---

## App Entry Point Integration

### App Setup

```swift
import SwiftUI

@main
struct EpilogueApp: App {
    @StateObject private var subscriptionManager = SubscriptionManager()
    @StateObject private var usageManager: UsageManager

    init() {
        let subManager = SubscriptionManager()
        _subscriptionManager = StateObject(wrappedValue: subManager)
        _usageManager = StateObject(wrappedValue: UsageManager(subscriptionManager: subManager))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(subscriptionManager)
                .environmentObject(usageManager)
                .task {
                    await subscriptionManager.updateSubscriptionStatus()
                }
        }
    }
}
```

---

## Testing Checklist

### StoreKit Testing Scenarios

```markdown
## Purchase Flow
- [ ] Monthly subscription purchase completes
- [ ] Annual subscription purchase completes
- [ ] Purchase cancelled by user (no error shown)
- [ ] Purchase pending (Ask to Buy) handled
- [ ] Purchase restored successfully

## Subscription States
- [ ] Free tier limits enforced
- [ ] Pro tier limits applied after purchase
- [ ] Trial period detected correctly
- [ ] Trial days remaining calculated
- [ ] Expired subscription reverts to free
- [ ] Grace period maintains access
- [ ] Billing retry maintains access

## Usage Tracking
- [ ] AI message counter increments
- [ ] Quote capture counter increments
- [ ] Monthly reset occurs correctly
- [ ] Limits persist across app restart
- [ ] Pro limits applied when subscribed

## Edge Cases
- [ ] No network during purchase
- [ ] Subscription status offline
- [ ] Family Sharing detected
- [ ] Subscription downgrade handled
- [ ] Receipt verification failure

## Paywall UI
- [ ] Products load correctly
- [ ] Prices formatted for locale
- [ ] Trial offer displayed
- [ ] Annual savings shown
- [ ] Feature highlight works
- [ ] Legal links functional
```

### Sandbox Testing

```swift
// Add to SubscriptionManager for debug builds
#if DEBUG
func debugResetPurchases() {
    purchasedProductIDs.removeAll()
    subscriptionStatus = .none
}

func debugSimulatePro() {
    subscriptionStatus = .subscribed
}

func debugSimulateTrial() {
    subscriptionStatus = .inTrial
}
#endif
```

---

## Analytics Events

Track these events for conversion optimization:

```swift
enum SubscriptionEvent: String {
    // Paywall
    case paywallViewed = "paywall_viewed"
    case paywallDismissed = "paywall_dismissed"
    case productSelected = "product_selected"

    // Purchase
    case purchaseStarted = "purchase_started"
    case purchaseCompleted = "purchase_completed"
    case purchaseCancelled = "purchase_cancelled"
    case purchaseFailed = "purchase_failed"

    // Subscription
    case trialStarted = "trial_started"
    case trialConverted = "trial_converted"
    case subscriptionRenewed = "subscription_renewed"
    case subscriptionExpired = "subscription_expired"
    case subscriptionCancelled = "subscription_cancelled"

    // Usage
    case limitReached = "limit_reached"
    case upgradePromptShown = "upgrade_prompt_shown"
}

// Track with parameters
func trackEvent(_ event: SubscriptionEvent, parameters: [String: Any] = [:]) {
    var params = parameters
    params["timestamp"] = Date().timeIntervalSince1970
    params["subscription_status"] = subscriptionManager.subscriptionStatus.rawValue

    // Send to analytics service
    Analytics.shared.track(event.rawValue, parameters: params)
}
```

---

## Server-Side Validation (Optional)

For enhanced security, validate receipts server-side:

```swift
// Server endpoint for receipt validation
struct ReceiptValidationRequest: Codable {
    let receiptData: String
    let excludeOldTransactions: Bool
}

struct ReceiptValidationResponse: Codable {
    let isValid: Bool
    let expirationDate: Date?
    let productID: String?
}

extension SubscriptionManager {
    func validateWithServer() async throws -> Bool {
        // Get receipt data
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              let receiptData = try? Data(contentsOf: receiptURL) else {
            return false
        }

        let base64Receipt = receiptData.base64EncodedString()

        // Send to your server for validation
        let request = ReceiptValidationRequest(
            receiptData: base64Receipt,
            excludeOldTransactions: true
        )

        // Your server calls Apple's verifyReceipt endpoint
        // and returns validated status
        let response: ReceiptValidationResponse = try await APIClient.shared
            .post("/validate-receipt", body: request)

        return response.isValid
    }
}
```

---

## References

- [StoreKit 2 Documentation](https://developer.apple.com/documentation/storekit/in-app_purchase)
- [Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [StoreKit Views Guide](https://www.revenuecat.com/blog/engineering/storekit-views-guide-paywall-swift-ui/)
- [iOS In-App Subscription Tutorial](https://www.revenuecat.com/blog/engineering/ios-in-app-subscription-tutorial-with-storekit-2-and-swift/)
- [Superwall StoreKit Fieldguide](https://superwall.com/blog/storekit-paywall-views-in-swiftui-the-complete-fieldguide)
