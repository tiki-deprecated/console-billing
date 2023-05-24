/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

import { L0Auth } from "./l0/auth/l0-auth";
import { Client } from "./stripe/client";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      guardCORS(request, env);

      if (request.method === "GET") {
        const url = new URL(request.url);
        const pathName = url.pathname.endsWith("/")
          ? url.pathname.slice(0, -1)
          : url.pathname;

        const l0Auth = new L0Auth(env.L0_AUTH_DOMAIN);
        const stripe = new Client(
          env.STRIPE_SK,
          `${env.ORIGIN}/${env.BILLING_PAGE}`
        );

        if (pathName === "/api/latest/billing") {
          return handleBilling(stripe, l0Auth, request, env);
        } else if (pathName === "/api/latest/billing/subscriptions") {
          return handleSubscriptions(stripe, l0Auth, request, env);
        } else if (pathName === "/api/latest/billing/checkout") {
          return handleCheckout(stripe, l0Auth, request, env);
        }
      }

      return new Response(null, {
        status: 405,
        headers: getCorsHeaders(env.ORIGIN),
      });
    } catch (error: unknown) {
      if (error instanceof Response) return error;
      else {
        return Response.json(
          { message: String(error) },
          { status: 500, headers: getCorsHeaders(env.ORIGIN) }
        );
      }
    }
  },
};

function guardCORS(request: Request, env: Env): void {
  if (request.method === "OPTIONS") {
    throw new Response(null, {
      status: 200,
      headers: getCorsHeaders(env.ORIGIN),
    });
  }
}

function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  };
}

async function handleBilling(
  stripe: Client,
  l0Auth: L0Auth,
  request: Request,
  env: Env
): Promise<Response> {
  const authorization = request.headers.get("Authorization") ?? "";
  const user = await l0Auth.user(authorization);
  const org = await l0Auth.org(authorization, user.orgId);
  if (org.billingId != null) {
    const url = await stripe.portal(org.billingId);
    if (url != null) {
      return new Response(JSON.stringify({ url }), {
        status: 200,
        headers: getCorsHeaders(env.ORIGIN),
      });
    } else {
      return Response.json(
        { message: "Unprocessable Entity" },
        { status: 422, headers: getCorsHeaders(env.ORIGIN) }
      );
    }
  } else
    return Response.json(
      { message: "No billingId", help: "Try /checkout" },
      { status: 404, headers: getCorsHeaders(env.ORIGIN) }
    );
}

async function handleSubscriptions(
  stripe: Client,
  l0Auth: L0Auth,
  request: Request,
  env: Env
): Promise<Response> {
  const authorization = request.headers.get("Authorization") ?? "";
  const user = await l0Auth.user(authorization);
  const org = await l0Auth.org(authorization, user.orgId);
  if (org.billingId != null) {
    const subs = await stripe.subscriptions(org.billingId);
    return Response.json(subs, {
      status: 200,
      headers: getCorsHeaders(env.ORIGIN),
    });
  } else
    return Response.json(
      { message: "No billingId", help: "Try /checkout" },
      { status: 404, headers: getCorsHeaders(env.ORIGIN) }
    );
}

async function handleCheckout(
  stripe: Client,
  l0Auth: L0Auth,
  request: Request,
  env: Env
): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const authorization = request.headers.get("Authorization") ?? "";
  const user = await l0Auth.user(authorization);
  const org = await l0Auth.org(authorization, user.orgId);

  let lineItems;
  const productId = params.get("product");
  if (productId === env.STRIPE_LMSMAO_PRODUCT_ID) {
    await stripe.subscribe(
      [
        {
          price: env.STRIPE_LMSMAO_PRICE_ID,
          quantity: 0,
        },
      ],
      org.billingId ?? ""
    );
    return new Response(null, {
      status: 201,
      headers: getCorsHeaders(env.ORIGIN),
    });
  } else if (productId === env.STRIPE_LMSM_PRODUCT_ID) {
    lineItems = [{ price: env.STRIPE_LMSM_PRICE_ID, quantity: 1 }];
  } else {
    lineItems = [
      {
        price: env.STRIPE_IGT_PRICE_ID,
        quantity: 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
      },
    ];
  }

  const url = await stripe.checkout(lineItems, user.orgId, org.billingId);
  if (url != null) {
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: getCorsHeaders(env.ORIGIN),
    });
  } else {
    return Response.json(
      { message: "Unprocessable Entity" },
      { status: 422, headers: getCorsHeaders(env.ORIGIN) }
    );
  }
}
