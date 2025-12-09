import { json, type LoaderFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// GET  /app/get-variant-price?variantId=gid://shopify/ProductVariant/123...
export const loader: LoaderFunction = async ({ request }) => {
  console.log('request :>> ', request);
  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!variantId) {
    return json({ error: "Missing variantId" }, { status: 400 });
  }

  const { admin } = await authenticate.admin(request);
  console.log('variantId :>> ', variantId);
  const query = `
    query GetVariantPrice($id: ID!) {
      productVariant(id: $id) {
        id
        price
      }
    }
  `;

  const response = await admin.graphql(query, {
    variables: { id: variantId },
  });

  const data = await response.json();
  // Hata kontrolü
  // if (data.errors) {
  //   console.error("GraphQL errors:", data.errors);
  //   return json({ error: "GraphQL error" }, { status: 500 });
  // }

  if (!data.data?.productVariant) {
    return json({ error: "Could not fetch variant price" }, { status: 500 });
  }

  return json({ price: data.data.productVariant.price });
};