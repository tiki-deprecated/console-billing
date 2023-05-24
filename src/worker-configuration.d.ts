/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

interface Env {
  ORIGIN: string;
  BILLING_PAGE: string;
  L0_AUTH_DOMAIN: string;

  STRIPE_SK: string;
  STRIPE_IGT_PRICE_ID: string;
  STRIPE_IGT_PRODUCT_ID: string;
  STRIPE_LMSM_PRICE_ID: string;
  STRIPE_LMSM_PRODUCT_ID: string;
  STRIPE_LMSMAO_PRICE_ID: string;
  STRIPE_LMSMAO_PRODUCT_ID: string;
}
