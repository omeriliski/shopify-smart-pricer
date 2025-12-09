import type { LoaderFunction } from "@remix-run/node";
import { useState } from "react";

export const loader: LoaderFunction = async () => {
  return null;
};

export default function Index() {
  
  const [variantId, setVariantId] = useState("");
  const [percent, setPercent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [oldPrice, setOldPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string | null>(null);
  
  const PRODUCT_ID = "8719533932742"; 
  async function changePrice() {
    setLoading(true);
    setResult(null);
    setOldPrice(null);
    setNewPrice(null);

    // Kullanıcıya kolaylık: sadece sayıyı girsin, biz GID yapalım
    const variantGid =
      variantId.startsWith("gid://shopify/ProductVariant/")
        ? variantId
        : `gid://shopify/ProductVariant/${variantId}`;
    
    const productGid = `gid://shopify/Product/${PRODUCT_ID}`;

    // 1) Mevcut fiyatı al
    const priceRes = await fetch(
      `/app/get-variant-price?variantId=${encodeURIComponent(variantGid)}`
    );

    if (!priceRes.ok) {
      const text = await priceRes.text();
      console.error("Price fetch error:", text);
      setResult("Failed to fetch current price");
      setLoading(false);
      return;
    }

    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price);
    setOldPrice(priceData.price);

    const percentValue = parseFloat(percent);
    if (Number.isNaN(currentPrice) || Number.isNaN(percentValue)) {
      setResult("Invalid price or percent");
      setLoading(false);
      return;
    }

    // 2) Yeni fiyatı hesapla
    const calculatedNewPrice = (currentPrice * (1 + percentValue / 100)).toFixed(
      2
    );
    setNewPrice(calculatedNewPrice);
    // 3) Shopify'da fiyatı güncelle
    const res = await fetch("/app/update-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: productGid,
        variantId: variantGid,
        newPrice: calculatedNewPrice,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Update error:", text);
      setResult("Failed to update price");
      setLoading(false);
      return;
    }

    const data = await res.json();
    console.log("Update result:", data);
    setResult("Success");
    setLoading(false);
  }

  return (
    <s-page>
      <s-stack direction="block" gap="base">
        {/* Product ID input removed, using hardcoded value */}

        <input
          type="text"
          placeholder="Variant ID (e.g. 45282697740486 or gid://shopify/ProductVariant/...)"
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          style={{ width: 400, padding: 8, fontSize: 16 }}
        />

        <input
          type="number"
          placeholder="Percent (e.g. 10 for +10%)"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          style={{ width: 200, padding: 8, fontSize: 16 }}
        />

        <s-button
          onClick={changePrice}
          disabled={loading || !variantId || !percent}
        >
          {loading
            ? "Updating..."
            : `Increase price by %${percent}`}
        </s-button>

        {oldPrice && (
          <div style={{ marginTop: 8 }}>
            <b>Old price:</b> {oldPrice}
          </div>
        )}

        {newPrice && (
          <div style={{ marginTop: 4 }}>
            <b>New price:</b> {newPrice}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 6,
              background: result === "Success" ? "#e6ffed" : "#ffe6e6",
              color: result === "Success" ? "#228B22" : "#B22222",
              fontWeight: "bold",
            }}
          >
            {result}
          </div>
        )}
      </s-stack>
    </s-page>
  );
}