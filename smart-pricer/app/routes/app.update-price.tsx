// app/routes/app.update-price.tsx
import { json, type ActionFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { productId, variantId, newPrice } = await request.json();

  console.log('productId :>> ', productId);
  const mutation = `
    mutation UpdateVariantPrice(
      $productId: ID!
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    productId,
    variants: [
      {
        id: variantId,
        price: newPrice, // Shopify API string price bekliyor
      },
    ],
  };

  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

  return json(data);
};