/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

interface L0AuthUser {
  userId: string;
  email: string;
  modified: Date;
  created: Date;
  apps: Array<string>;
  billingId?: string;
}
