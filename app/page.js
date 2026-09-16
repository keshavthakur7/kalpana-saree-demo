import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import HeroSlideshow from "../components/HeroSlideshow";
import ProductCard from "../components/ProductCard";
import { db } from "../lib/db";
import { cacheGet, cacheSet } from "../lib/redis";
import { DEMO_PRODUCTS } from "../lib/demoProducts";

const categoryTiles = [
  { name: "Silk Sarees", value: "Silk", image: "/products/kanjivaram-silk.jpg" },
  { name: "Wedding Sarees", value: "Wedding", image: "/products/wedding-collection.jpg" },
  { name: "Party Wear", value: "Party Wear", image: "/products/chiffon-party.jpg" },
  { name: "Cotton Sarees", value: "Cotton", image: "/products/cotton-handloom.jpg" },
  { name: "Festive Collection", value: "Festive", image: "/products/banarasi-silk.jpg" },
  { name: "New Arrivals", value: "", sort: "newest", image: "/products/linen-saree.jpg" },
  { name: "Best Sellers", value: "", sort: "featured", image: "/products/tussar-silk.jpg" }
];

async function getFeaturedProducts() {
  if (process.env.DEMO_MODE !== "false") return DEMO_PRODUCTS;

  const cacheKey = "catalog:featured:v3";
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { rows } = await db.query(
    `SELECT id, slug, name, fabric, category, color, price_paise,
            compare_at_price_paise, stock_qty, image_url
     FROM products
     WHERE active = TRUE
     ORDER BY featured DESC, created_at DESC
     LIMIT 10`
  );

  await cacheSet(cacheKey, rows, 60);
  return rows;
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <main className="min-h-screen bg-royal-cream text-royal-charcoal">
      <Header />

      <HeroSlideshow />

      <section id="collections" className="bg-[#fbf8f3] pb-16 pt-10 sm:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[.35em] text-royal-burgundy">Our Collection</p>
            <h2 className="mt-2 font-display text-4xl text-[#3c1d21] sm:text-5xl">Handpicked Sarees for You</h2>
            <div className="mx-auto mt-3 flex w-fit items-center gap-3 text-sm text-black/55">
              <span>Tradition</span><span>•</span><span>Elegance</span><span>•</span><span>You</span>
            </div>
            <div className="mx-auto mt-2 h-px w-16 bg-royal-gold" />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/shop" className="inline-flex rounded-full border border-royal-burgundy px-7 py-3 text-sm font-semibold text-royal-burgundy transition hover:bg-royal-burgundy hover:text-white">
              View All Sarees →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-black/5 md:grid-cols-4 lg:px-8">
          {[
            ["♢", "Premium Quality", "Authentic & handpicked sarees"],
            ["▱", "Cash on Delivery", "Shop with confidence"],
            ["↺", "Easy Returns", "Hassle-free within 7 days"],
            ["✣", "24/7 Support", "We're here to help"]
          ].map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-4 px-6 py-7 sm:px-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b78a42] text-2xl text-white">{icon}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs text-black/50">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#f7f2eb]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1fr_1.6fr_1fr] md:items-start lg:px-8">
          <div>
            <div className="font-display text-4xl tracking-[.06em] text-[#b78a42]">KALPANA</div>
            <div className="mt-0 text-xs tracking-[.45em] text-royal-burgundy">SAREES</div>
            <p className="mt-5 text-sm text-black/55">Sarees that celebrate you.</p>
          </div>

          <div className="md:border-x md:border-black/10 md:px-10">
            <h3 className="font-display text-2xl text-royal-burgundy">Subscribe to Our Newsletter</h3>
            <p className="mt-2 text-sm text-black/55">Get the latest collections, offers and updates.</p>
            <form className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input aria-label="Email address" type="email" required placeholder="Enter your email address" className="!rounded-md !bg-white" />
              <button type="submit" className="rounded-md bg-royal-burgundy px-7 py-3 text-sm font-semibold text-white">Subscribe</button>
            </form>
          </div>

          <div className="md:pl-4">
            <h3 className="font-semibold">Follow Us</h3>
            <div className="mt-5 flex gap-5 text-xl text-royal-burgundy">
              <span>◎</span><span>f</span><span>▶</span><span>p</span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-black/10 px-6 py-5 text-[11px] text-black/45 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Privacy Policy</span><span>Terms & Conditions</span><span>Shipping Policy</span><span>Returns & Refunds</span>
          </div>
          <div>© 2026 Kalpana Sarees. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
