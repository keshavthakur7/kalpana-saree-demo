import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import AddToCartButton from "../../../components/AddToCartButton";
import { db } from "../../../lib/db";
import { formatINR } from "../../../lib/format";
import { getProductImage } from "../../../lib/productImage";

async function getProduct(slug) {
  const { rows } = await db.query(
    `SELECT id, slug, sku, name, short_description, description, fabric,
            category, color, price_paise, compare_at_price_paise,
            stock_qty, image_url
     FROM products
     WHERE slug = $1 AND active = TRUE
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-royal-cream">
      <Header />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-luxury">
          <div className="relative aspect-[3/4]">
            <Image src={getProductImage(product)} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Link href="/" className="mb-6 text-xs uppercase tracking-[.3em] text-royal-burgundy">← Back to collection</Link>
          <p className="text-xs uppercase tracking-[.35em] text-black/45">{product.fabric} · {product.category}</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-tight text-royal-burgundy md:text-6xl">{product.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-black/65">{product.short_description}</p>
          <div className="mt-7 flex items-baseline gap-4">
            <span className="text-3xl font-semibold">{formatINR(product.price_paise)}</span>
            {product.compare_at_price_paise ? <span className="text-lg text-black/35 line-through">{formatINR(product.compare_at_price_paise)}</span> : null}
          </div>
          <div className="mt-8 max-w-md"><AddToCartButton product={product} /></div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white p-4"><div className="text-[10px] uppercase tracking-[.2em] text-black/40">Fabric</div><div className="mt-2 font-medium">{product.fabric}</div></div>
            <div className="rounded-2xl bg-white p-4"><div className="text-[10px] uppercase tracking-[.2em] text-black/40">Colour</div><div className="mt-2 font-medium">{product.color || "Signature"}</div></div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h2 className="font-display text-2xl text-royal-burgundy">About the saree</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-black/65">{product.description}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
