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
          return handleBilling(
            stripe,
            await l0Auth.user(request.headers.get("Authorization") ?? "")
          );
        } else if (pathName === "/api/latest/billing/subscriptions") {
          return handleSubscriptions(
            stripe,
            await l0Auth.user(request.headers.get("Authorization") ?? ""),
            env
          );
        } else if (pathName === "/api/latest/billing/checkout") {
          return handleCheckout(
            stripe,
            await l0Auth.user(request.headers.get("Authorization") ?? ""),
            env
          );
        }
      }

      return new Response(null, { status: 405 });
    } catch (error: unknown) {
      if (error instanceof Response) return error;
      else {
        return Response.json({ message: String(error) }, { status: 500 });
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
    "Access-Control-Allow-Methods": "OPTIONS, GET",
  };
}

async function handleBilling(
  stripe: Client,
  user: L0AuthUser
): Promise<Response> {
  if (user.billingId != null) return stripe.portal(user.billingId);
  else
    return Response.json(
      { message: "No billingId", help: "Try /checkout" },
      { status: 404 }
    );
}

async function handleSubscriptions(
  stripe: Client,
  user: L0AuthUser,
  env: Env
): Promise<Response> {
  if (user.billingId != null) {
    const subs = await stripe.subscriptions(user.billingId);
    return Response.json(subs, {
      headers: getCorsHeaders(env.ORIGIN),
    });
  } else
    return Response.json(
      { message: "No billingId", help: "Try /checkout" },
      { status: 404 }
    );
}

async function handleCheckout(
  stripe: Client,
  user: L0AuthUser,
  env: Env
): Promise<Response> {
  return stripe.checkout(
    [env.STRIPE_PID_MAU, env.STRIPE_PID_NU],
    user.userId,
    user.billingId
  );
}
