/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

interface L0AuthOrg {
  orgId: string;
  billingId?: string;
  modified: Date;
  created: Date;
  users?: Array<string>;
  apps?: Array<string>;
}
