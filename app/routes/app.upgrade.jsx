import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  // const { billing, session } = await authenticate.admin(request);
  // const billingCheck = await billing.require({
  //   plans: [MONTHLY_PLAN, ANNUAL_PLAN],
  //   isTest: true,
  //   onFailure: () => redirect('/app/pricing'),
  // });

  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  console.log(myShop, "myShop upgrade");

  const billingCheck = await billing.require({
    plans: [MONTHLY_PLAN],
    onFailure: async () => billing.request({
      plan: MONTHLY_PLAN,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
    }),
  });

  // const subscription = billingCheck.appSubscriptions[0];
  // console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

  // redirect('/app/pricing');
  // App logic

 // return null;
};