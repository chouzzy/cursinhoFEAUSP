{
    id: 'cs_test_a127uJdgVfaWDSNNNoOuxxE4A1I2WTmeR7RLWJp1jYQmICeH9TIuo80fMD',
    object: 'checkout.session',
    after_expiration: null,
    allow_promotion_codes: false,
    amount_subtotal: 3500,
    amount_total: 3500,
    automatic_tax: { enabled: false, status: null },
    billing_address_collection: 'required',
    cancel_url: 'https://stripe.com',
    client_reference_id: null,
    consent: null,
    consent_collection: { promotions: 'none', terms_of_service: 'none' },
    created: 1682009055,
    currency: 'brl',
    currency_conversion: null,
    custom_fields: [
      {
        dropdown: null,
        key: 'cpf',
        label: [Object],
        numeric: [Object],
        optional: false,
        text: null,
        type: 'numeric'
      }
    ],
    custom_text: { shipping_address: null, submit: null },
    customer: null,
    customer_creation: 'if_required',
    customer_details: {
      address: {
        city: 'São Paulo',
        country: 'BR',
        line1: 'Rua Carolina Fonseca 453, Apto 124 Torre 2',
        line2: 'Itaquera',
        postal_code: '08230030',
        state: 'SP'
      },
      email: 'bob@siricascudo.com',
      name: 'bb',
      phone: '+551171412344',
      tax_exempt: 'none',
      tax_ids: []
    },
    customer_email: null,
    expires_at: 1682095454,
    invoice: null,
    invoice_creation: {
      enabled: false,
      invoice_data: {
        account_tax_ids: null,
        custom_fields: null,
        description: null,
        footer: null,
        metadata: {},
        rendering_options: null
      }
    },
    livemode: false,
    locale: 'pt-BR',
    metadata: {},
    mode: 'payment',
    payment_intent: 'pi_3Mz0b2HkzIzO4aMO1iaTzwNK',
    payment_link: 'plink_1MyzlmHkzIzO4aMOTrdLYwrg',
    payment_method_collection: 'always',
    payment_method_options: {},
    payment_method_types: [ 'card' ],
    payment_status: 'paid',
    phone_number_collection: { enabled: true },
    recovered_from: null,
    setup_intent: null,
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: 'complete',
    submit_type: 'auto',
    subscription: null,
    success_url: 'https://stripe.com',
    total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
    url: null
  }





  payment_intent.succeeded
{
  id: 'pi_3Mz0b2HkzIzO4aMO1iaTzwNK',
  object: 'payment_intent',
  amount: 3500,
  amount_capturable: 0,
  amount_details: { tip: {} },
  amount_received: 3500,
  application: null,
  application_fee_amount: null,
  automatic_payment_methods: null,
  canceled_at: null,
  cancellation_reason: null,
  capture_method: 'automatic',
  client_secret: 'pi_3Mz0b2HkzIzO4aMO1iaTzwNK_secret_B676a6l5YQTnFUbyBQUmmG4RA',
  confirmation_method: 'automatic',
  created: 1682009076,
  currency: 'brl',
  customer: null,
  description: null,
  invoice: null,
  last_payment_error: null,
  latest_charge: 'ch_3Mz0b2HkzIzO4aMO1mSIsXd9',
  livemode: false,
  metadata: {},
  next_action: null,
  on_behalf_of: null,
  payment_method: 'pm_1Mz0b2HkzIzO4aMOIVgC64G8',
  payment_method_options: {
    card: {
      installments: null,
      mandate_options: null,
      network: null,
      request_three_d_secure: 'automatic'
    }
  },
  payment_method_types: [ 'card' ],
  processing: null,
  receipt_email: null,
  review: null,
  setup_future_usage: null,
  shipping: null,
  source: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: null,
  transfer_group: null
}









customer.subscription.created
{
  id: 'sub_1N0X4NHkzIzO4aMO4dMkvO9t',
  object: 'subscription',
  application: null,
  application_fee_percent: null,
  automatic_tax: { enabled: false },
  billing_cycle_anchor: 1682372231,
  billing_thresholds: null,
  cancel_at: 1690234631,
  cancel_at_period_end: false,
  canceled_at: 1682372231,
  cancellation_details: { comment: null, feedback: null, reason: 'cancellation_requested' },
  collection_method: 'charge_automatically',
  created: 1682372231,
  currency: 'brl',
  current_period_end: 1684964231,
  current_period_start: 1682372231,
  customer: 'cus_Nm4ld7QupcCmOD',
  days_until_due: null,
  default_payment_method: null,
  default_source: 'card_1N0X3gHkzIzO4aMOdesqd8SM',
  default_tax_rates: [],
  description: null,
  discount: null,
  ended_at: null,
  items: {
    object: 'list',
    data: [ [Object] ],
    has_more: false,
    total_count: 1,
    url: '/v1/subscription_items?subscription=sub_1N0X4NHkzIzO4aMO4dMkvO9t'
  },
  latest_invoice: 'in_1N0X4NHkzIzO4aMOPiX9XDdx',
  livemode: false,
  metadata: {},
  next_pending_invoice_item_invoice: null,
  on_behalf_of: null,
  pause_collection: null,
  payment_settings: {
    payment_method_options: null,
    payment_method_types: null,
    save_default_payment_method: null
  },
  pending_invoice_item_interval: null,
  pending_setup_intent: null,
  pending_update: null,
  plan: {
    id: 'price_1Mxy6HHkzIzO4aMO0tXO4ZJ2',
    object: 'plan',
    active: true,
    aggregate_usage: null,
    amount: 1000,
    amount_decimal: '1000',
    billing_scheme: 'per_unit',
    created: 1681761152,
    currency: 'brl',
    interval: 'month',
    interval_count: 1,
    livemode: false,
    metadata: {},
    nickname: 'Preço básico - doação para educação',
    product: 'prod_NjQy58PYtAOAPb',
    tiers_mode: null,
    transform_usage: null,
    trial_period_days: null,
    usage_type: 'licensed'
  },
  quantity: 1,
  schedule: 'sub_sched_1N0X4NHkzIzO4aMO0eDpNBbB',
  start_date: 1682372231,
  status: 'active',
  test_clock: null,
  transfer_data: null,
  trial_end: null,
  trial_settings: { end_behavior: { missing_payment_method: 'create_invoice' } },
  trial_start: null
}
sub_1N0X4NHkzIzO4aMO4dMkvO9t

this is customer:
{
  id: 'cus_Nm4ld7QupcCmOD',
  object: 'customer',
  address: {
    city: 'santiago',
    country: 'chile',
    line1: 'avenida del vino 443',
    line2: null,
    postal_code: null,
    state: 'santiago'
  },
  balance: 0,
  created: 1682370492,
  currency: 'brl',
  default_source: 'card_1N0X3gHkzIzO4aMOdesqd8SM',
  delinquent: false,
  description: null,
  discount: null,
  email: 'user2@hotmail.com',
  invoice_prefix: 'F075F61D',
  invoice_settings: {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null
  },
  livemode: false,
  metadata: {
    cpf: '43413386841',
    customerType: 'Donation',
    donationValue: '35',
    paymentType: 'Subscription'
  },
  name: 'User2',
  next_invoice_sequence: 1,
  phone: '11982425569',
  preferred_locales: [],
  shipping: null,
  tax_exempt: 'none',
  test_clock: null
}




charge.refunded
{
  id: 'ch_3N0ohgHkzIzO4aMO0YGgcthE',
  object: 'charge',
  amount: 3500,
  amount_captured: 3500,
  amount_refunded: 3500,
  application: null,
  application_fee: null,
  application_fee_amount: null,
  balance_transaction: 'txn_3N0ohgHkzIzO4aMO0Irmdnd2',
  billing_details: {
    address: {
      city: 'São Paulo',
      country: 'BR',
      line1: '330',
      line2: 'Itaquera',
      postal_code: '08230030',
      state: 'SP'
    },
    email: 'estudante2@gmail.com',
    name: 'Estudante 2',
    phone: null
  },
  calculated_statement_descriptor: 'Stripe',
  captured: true,
  created: 1682440017,
  currency: 'brl',
  customer: 'cus_NmNSX6JtD9Lf6N',
  description: null,
  destination: null,
  dispute: null,
  disputed: false,
  failure_balance_transaction: null,
  failure_code: null,
  failure_message: null,
  fraud_details: {},
  invoice: null,
  livemode: false,
  metadata: {},
  on_behalf_of: null,
  order: null,
  outcome: {
    network_status: 'approved_by_network',
    reason: null,
    risk_level: 'normal',
    risk_score: 0,
    seller_message: 'Payment complete.',
    type: 'authorized'
  },
  paid: true,
  payment_intent: 'pi_3N0ohgHkzIzO4aMO0EbKF0Zb',
  payment_method: 'pm_1N0ohgHkzIzO4aMOxZzmhZNc',
  payment_method_details: {
    card: {
      brand: 'visa',
      checks: [Object],
      country: 'US',
      exp_month: 2,
      exp_year: 2042,
      fingerprint: 'gsNZjynIyxWTn1bh',
      funding: 'credit',
      installments: null,
      last4: '4242',
      mandate: null,
      network: 'visa',
      network_token: [Object],
      three_d_secure: null,
      wallet: null
    },
    type: 'card'
  },
  receipt_email: null,
  receipt_number: null,
  receipt_url: 'https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTXRVcXFIa3pJek80YU1PKLKBoKIGMgaT1BDrPxw6LBZ3rpnLNDvE-SfwP0fPYlSqfALRyN5aaP3X0zQWzxgcPwxfAElmrRpkuU7T',
  refunded: true,
  review: null,
  shipping: null,
  source: null,
  source_transfer: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: null,
  transfer_group: null
}





charge.succeeded
{
  id: 'ch_3N0qgbHkzIzO4aMO1BaEO7PH',
  object: 'charge',
  amount: 3500,
  amount_captured: 3500,
  amount_refunded: 0,
  application: null,
  application_fee: null,
  application_fee_amount: null,
  balance_transaction: 'txn_3N0qgbHkzIzO4aMO1BrvpEAO',
  billing_details: {
    address: {
      city: 'São Paulo',
      country: 'BR',
      line1: '330',
      line2: null,
      postal_code: '01140-070',
      state: 'SP'
    },
    email: 'estudante2@gmail.com',
    name: 'ESTUDANTE 2',
    phone: null
  },
  calculated_statement_descriptor: 'Stripe',
  captured: true,
  created: 1682447638,
  currency: 'brl',
  customer: 'cus_NmPVdLUOHQ6MC9',
  description: null,
  destination: null,
  dispute: null,
  disputed: false,
  failure_balance_transaction: null,
  failure_code: null,
  failure_message: null,
  fraud_details: {},
  invoice: null,
  livemode: false,
  metadata: {},
  on_behalf_of: null,
  order: null,
  outcome: {
    network_status: 'approved_by_network',
    reason: null,
    risk_level: 'normal',
    risk_score: 4,
    seller_message: 'Payment complete.',
    type: 'authorized'
  },
  paid: true,
  payment_intent: 'pi_3N0qgbHkzIzO4aMO1VhZ4YR6',
  payment_method: 'pm_1N0qgbHkzIzO4aMOH9yuszzn',
  payment_method_details: {
    card: {
      brand: 'visa',
      checks: [Object],
      country: 'US',
      exp_month: 4,
      exp_year: 2024,
      fingerprint: 'gsNZjynIyxWTn1bh',
      funding: 'credit',
      installments: null,
      last4: '4242',
      mandate: null,
      network: 'visa',
      network_token: [Object],
      three_d_secure: null,
      wallet: null
    },
    type: 'card'
  },
  receipt_email: null,
  receipt_number: null,
  receipt_url: 'https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTXRVcXFIa3pJek80YU1PKJe6oKIGMgaXypdifwk6LBalI2UB7_lpU3g20TYIOGiThkLUnr2UrWo_IVjUYwE2_Oy12tyPjVLn55WW',
  refunded: false,
  review: null,
  shipping: null,
  source: null,
  source_transfer: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: null,
  transfer_group: null
}










customer.subscription.deleted
{
  id: 'sub_1N482fHkzIzO4aMOhqvYHo7O',
  object: 'subscription',
  application: null,
  application_fee_percent: null,
  automatic_tax: { enabled: false },
  billing_cycle_anchor: 1683229337,
  billing_thresholds: null,
  cancel_at: null,
  cancel_at_period_end: false,
  canceled_at: 1683571016,
  cancellation_details: { comment: null, feedback: null, reason: 'cancellation_requested' },
  collection_method: 'charge_automatically',
  created: 1683229337,
  currency: 'brl',
  current_period_end: 1685907737,
  current_period_start: 1683229337,
  customer: 'cus_NpnbMDiK4mIqg9',
  days_until_due: null,
  default_payment_method: 'pm_1N482eHkzIzO4aMOZNg8gm1e',
  default_source: null,
  default_tax_rates: [],
  description: null,
  discount: null,
  ended_at: 1683571016,
  items: {
    object: 'list',
    data: [ [Object] ],
    has_more: false,
    total_count: 1,
    url: '/v1/subscription_items?subscription=sub_1N482fHkzIzO4aMOhqvYHo7O'
  },
  latest_invoice: 'in_1N482fHkzIzO4aMOw6gGSvZu',
  livemode: false,
  metadata: {
    rg: '000000006',
    cpf: '00000000006',
    stripeCustomerID: 'cus_NpnbMDiK4mIqg9',
    subscriptionType: 'SchoolClass',
    schoolClassID: '6df7a3ba-81b5-4ff4-8dcf-35e1cddbe5e9'
  },
  next_pending_invoice_item_invoice: null,
  on_behalf_of: null,
  pause_collection: null,
  payment_settings: {
    payment_method_options: null,
    payment_method_types: null,
    save_default_payment_method: 'off'
  },
  pending_invoice_item_interval: null,
  pending_setup_intent: null,
  pending_update: null,
  plan: {
    id: 'price_1N482fHkzIzO4aMOu0bQvpQ3',
    object: 'plan',
    active: false,
    aggregate_usage: null,
    amount: 1000,
    amount_decimal: '1000',
    billing_scheme: 'per_unit',
    created: 1683229337,
    currency: 'brl',
    interval: 'month',
    interval_count: 1,
    livemode: false,
    metadata: {},
    nickname: null,
    product: 'prod_NmpAHf1qPgwXHo',
    tiers_mode: null,
    transform_usage: null,
    trial_period_days: null,
    usage_type: 'licensed'
  },
  quantity: 1,
  schedule: null,
  start_date: 1683229337,
  status: 'canceled',
  test_clock: null,
  transfer_data: null,
  trial_end: null,
  trial_settings: { end_behavior: { missing_payment_method: 'create_invoice' } },
  trial_start: null
}












charge.refunded
{
  id: 'ch_3N480xHkzIzO4aMO0KlT0EFM',
  object: 'charge',
  amount: 1000,
  amount_captured: 1000,
  amount_refunded: 1000,
  application: null,
  application_fee: null,
  application_fee_amount: null,
  balance_transaction: 'txn_3N480xHkzIzO4aMO078etqPM',
  billing_details: {
    address: {
      city: null,
      country: null,
      line1: null,
      line2: null,
      postal_code: null,
      state: null
    },
    email: null,
    name: null,
    phone: null
  },
  calculated_statement_descriptor: 'Stripe',
  captured: true,
  created: 1683229232,
  currency: 'brl',
  customer: 'cus_NpnbMDiK4mIqg9',
  description: 'Subscription creation',
  destination: null,
  dispute: null,
  disputed: false,
  failure_balance_transaction: null,
  failure_code: null,
  failure_message: null,
  fraud_details: {},
  invoice: 'in_1N480xHkzIzO4aMODOWATFMn',
  livemode: false,
  metadata: {},
  on_behalf_of: null,
  order: null,
  outcome: {
    network_status: 'approved_by_network',
    reason: null,
    risk_level: 'normal',
    risk_score: 54,
    seller_message: 'Payment complete.',
    type: 'authorized'
  },
  paid: true,
  payment_intent: 'pi_3N480xHkzIzO4aMO00m5qq4K',
  payment_method: 'pm_1N480wHkzIzO4aMOyIqYOOzu',
  payment_method_details: {
    card: {
      brand: 'visa',
      checks: [Object],
      country: 'US',
      exp_month: 4,
      exp_year: 2042,
      fingerprint: 'gsNZjynIyxWTn1bh',
      funding: 'credit',
      installments: null,
      last4: '4242',
      mandate: null,
      network: 'visa',
      network_token: [Object],
      three_d_secure: null,
      wallet: null
    },
    type: 'card'
  },
  receipt_email: null,
  receipt_number: null,
  receipt_url: 'https://pay.stripe.com/receipts/invoices/CAcaFwoVYWNjdF8xTXRVcXFIa3pJek80YU1PKL-J5aIGMgaxSs-nrdk6LBaRuJOIXgxOkAG2THKauT-GcDc-Qf78C5XmyzwyXGHy3yM0TOBC3RticPA8?s=ap',
  refunded: true,
  review: null,
  shipping: null,
  source: null,
  source_transfer: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: null,
  transfer_group: null
}