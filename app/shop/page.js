import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import AddToCartButton from "../../components/AddToCartButton";
import { db } from "../../lib/db";
import { cacheGet, cacheSet } from "../../lib/redis";
import { formatINR } from "../../lib/format";
import { getProductImage } from "../../lib/productImage";
import { DEMO_PRODUCTS } from "../../lib/demoProducts";

const CATEGORY_OPTIONS = [
  ["All Sarees", ""],
  ["Silk Sarees", "Silk"],
  ["Wedding", "Wedding"],
  ["Party Wear", "Party Wear"],
  ["Cotton", "Cotton"],
  ["Organza", "Organza"],
  ["Embroidered", "Embroidered"],
  ["Linen", "Linen"],
  ["Printed", "Printed"],
];

const FABRIC_OPTIONS = ["Kanjivaram", "Banarasi", "Organza", "Tussar", "Silk"];

async function getProducts({ category, fabric, q, min, max, sort }) {
  const normalized = {
    category: category || "",
    fabric: fabric || "",
    q: q || "",
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    sort: sort || "featured"
  };

  if (process.env.DEMO_MODE !== "false") {
    let rows = DEMO_PRODUCTS.filter((product) => {
      if (normalized.category && product.category !== normalized.category) return false;
      if (normalized.fabric && product.fabric !== normalized.fabric) return false;
      if (normalized.q) {
        const haystack = `${product.name} ${product.fabric} ${product.category}`.toLowerCase();
        if (!haystack.includes(normalized.q.toLowerCase())) return false;
      }
      if (normalized.min > 0 && product.price_paise < normalized.min * 100) return false;
      if (normalized.max > 0 && product.price_paise > normalized.max * 100) return false;
      return true;
    });

    if (normalized.sort === "price-low") rows.sort((a,b) => a.price_paise - b.price_paise);
    if (normalized.sort === "price-high") rows.sort((a,b) => b.price_paise - a.price_paise);
    if (normalized.sort === "featured") rows.sort((a,b) => Number(b.featured) - Number(a.featured));
    return rows.slice(0, 48);
  }

  const cacheKey = `catalog:shop:v2:${JSON.stringify(normalized)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const where = ["active = TRUE"];
  const values = [];
  let i = 1;

  if (normalized.category) {
    where.push(`category = $${i++}`);
    values.push(normalized.category);
  }

  if (normalized.fabric) {
    where.push(`fabric = $${i++}`);
    values.push(normalized.fabric);
  }

  if (normalized.q) {
    where.push(`(name ILIKE $${i} OR fabric::text ILIKE $${i} OR category ILIKE $${i})`);
    values.push(`%${normalized.q}%`);
    i++;
  }

  if (normalized.min > 0) {
    where.push(`price_paise >= $${i++}`);
    values.push(normalized.min * 100);
  }

  if (normalized.max > 0) {
    where.push(`price_paise <= $${i++}`);
    values.push(normalized.max * 100);
  }

  let orderBy = "featured DESC, created_at DESC";
  if (normalized.sort === "price-low") orderBy = "price_paise ASC";
  if (normalized.sort === "price-high") orderBy = "price_paise DESC";
  if (normalized.sort === "newest") orderBy = "created_at DESC";
  if (normalized.sort === "featured") orderBy = "featured DESC, created_at DESC";

  const { rows } = await db.query(
    `SELECT id, slug, name, fabric, category, color, price_paise,
            compare_at_price_paise, stock_qty, image_url
     FROM products
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT 48`,
    values
  );

  await cacheSet(cacheKey, rows, 60);
  return rows;
}

function buildHref(params, key, value) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  return `/shop?${next.toString()}`;
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || "";
  const fabric = params?.fabric || "";
  const q = params?.q || "";
  const sort = params?.sort || "featured";
  const min = params?.min ? Number(params.min) : 0;
  const max = params?.max ? Number(params.max) : 0;

  const products = await getProducts({ category, fabric, q, min, max, sort });

  return (
    <main className="min-h-screen bg-royal-cream">
      <Header />

      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-xs uppercase tracking-[.35em] text-royal-burgundy">
            Kalpana Saree · Collection
          </p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-5xl text-royal-burgundy">
                {category || q || fabric || "Shop All Sarees"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
                Curated sarees for weddings, celebrations, everyday elegance and every story in between.
              </p>
            </div>

            <form action="/shop" className="flex w-full max-w-xl gap-2">
              <input type="search" name="q" defaultValue={q} placeholder="Search sarees, fabrics or collections" />
              {category ? <input type="hidden" name="category" value={category} /> : null}
              {fabric ? <input type="hidden" name="fabric" value={fabric} /> : null}
              <button className="rounded-full bg-royal-burgundy px-5 text-sm text-white">Search</button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="h-fit rounded-3xl bg-white p-5 shadow-luxury lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-royal-burgundy">Filters</h2>
            <Link href="/shop" className="text-xs text-black/45 hover:text-royal-burgundy">Clear</Link>
          </div>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[.25em] text-black/40">Category</p>
            <div className="mt-3 space-y-1">
              {CATEGORY_OPTIONS.map(([name, value]) => {
                const active = category === value;
                return (
                  <Link
                    key={name}
                    href={buildHref(params, "category", value)}
                    className={`block rounded-xl px-3 py-2 text-sm ${
                      active ? "bg-royal-burgundy text-white" : "hover:bg-royal-cream"
                    }`}
                  >
                    {name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-7 border-t border-black/5 pt-6">
            <p className="text-[10px] uppercase tracking-[.25em] text-black/40">Fabric</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FABRIC_OPTIONS.map((item) => (
                <Link
                  key={item}
                  href={buildHref(params, "fabric", fabric === item ? "" : item)}
                  className={`rounded-full border px-3 py-2 text-xs ${
                    fabric === item
                      ? "border-royal-burgundy bg-royal-burgundy text-white"
                      : "border-black/10 bg-white hover:border-royal-gold"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-black/5 pt-6">
            <p className="text-[10px] uppercase tracking-[.25em] text-black/40">Price</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={buildHref(params, "max", "1999")} className="rounded-xl border border-black/10 px-3 py-2 text-xs">Under ₹1,999</Link>
              <Link href={buildHref(params, "min", "2000")} className="rounded-xl border border-black/10 px-3 py-2 text-xs">₹2,000+</Link>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex flex-col gap-3 border-b border-black/5 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-black/55">{products.length} sarees found</div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-black/45">Sort</span>
              <div className="flex gap-2 text-xs">
                {[
                  ["Recommended", "featured"],
                  ["Newest", "newest"],
                  ["Price: Low", "price-low"],
                  ["Price: High", "price-high"]
                ].map(([label, value]) => (
                  <Link
                    key={value}
                    href={buildHref(params, "sort", value)}
                    className={`rounded-full border px-3 py-2 ${
                      sort === value ? "border-royal-burgundy bg-royal-burgundy text-white" : "border-black/10"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl bg-white p-14 text-center shadow-luxury">
              <h2 className="font-display text-3xl text-royal-burgundy">No sarees found</h2>
              <p className="mt-3 text-sm text-black/55">Try another category, fabric or search term.</p>
              <Link href="/shop" className="mt-6 inline-block rounded-full bg-royal-burgundy px-6 py-3 text-sm text-white">
                View all sarees
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article key={product.id} className="group">
                  <Link href={`/products/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-luxury">
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[.2em] text-royal-burgundy">
                      {product.fabric}
                    </span>
                  </Link>

                  <div className="pt-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-display text-xl leading-tight text-royal-burgundy">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-semibold">{formatINR(product.price_paise)}</span>
                      <span className="text-xs text-black/40">{product.stock_qty} left</span>
                    </div>
                    <div className="mt-3">
                      <AddToCartButton product={product} compact />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
