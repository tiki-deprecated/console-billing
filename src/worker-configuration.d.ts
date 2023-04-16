/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

interface Env {
  ORIGIN: string;
  BILLING_PAGE: string;

  STRIPE_SK: string;
  STRIPE_PID_NU: string;
  STRIPE_PID_MAU: string;

  L0_AUTH_DOMAIN: string;
}
