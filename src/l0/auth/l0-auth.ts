/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

export class L0Auth {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async user(authorization: string): Promise<L0AuthUser> {
    const response = await fetch(`${this.url}/api/latest/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
    });
    if (response.status === 200) return response.json();
    else throw response;
  }

  async org(authorization: string, orgId: string): Promise<L0AuthOrg> {
    const response = await fetch(`${this.url}/api/latest/org/${orgId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
    });
    if (response.status === 200) return response.json();
    else throw response;
  }
}
