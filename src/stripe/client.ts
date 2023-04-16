/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

import Stripe from "stripe";

export class Client {
  stripe: Stripe;
  redirect: string;

  constructor(sk: string, redirect: string) {
    this.stripe = new Stripe(sk, { apiVersion: "2022-11-15" });
    this.redirect = redirect;
  }

  async checkout(
    priceIds: Array<string>,
    tikiId: string,
    stripeId?: string
  ): Promise<Response> {
    const session: Stripe.Response<Stripe.Checkout.Session> =
      await this.stripe.checkout.sessions.create({
        line_items: priceIds.map((id: string) => {
          return { price: id };
        }),
        mode: "subscription",
        success_url: this.redirect,
        cancel_url: this.redirect,
        automatic_tax: { enabled: true },
        client_reference_id: tikiId,
        customer: stripeId,
        subscription_data: {
          description: "TIKI PRO",
        },
      });
    if (session.url != null) return Response.redirect(session.url, 302);
    else
      throw Response.json({ message: "Unprocessable Entity" }, { status: 422 });
  }

  async portal(stripeId: string): Promise<Response> {
    const session: Stripe.Response<Stripe.BillingPortal.Session> =
      await this.stripe.billingPortal.sessions.create({
        customer: stripeId,
      });
    if (session.url != null) return Response.redirect(session.url, 302);
    else
      throw Response.json({ message: "Unprocessable Entity" }, { status: 422 });
  }

  async subscriptions(
    stripeId: string
  ): Promise<Stripe.Subscription | undefined> {
    const subs: Stripe.ApiList<Stripe.Subscription> =
      await this.stripe.subscriptions.list({
        customer: stripeId,
        status: "active",
      });
    return subs.data.pop();
  }
}
