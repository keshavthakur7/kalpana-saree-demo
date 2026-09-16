"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/hero-slides/hero-03.jpg",
    eyebrow: "TRADITION MEETS GRACE",
    title: "Sarees for",
    title2: "Every Story",
    subtitle: "Timeless Elegance for the Modern You",
    caption: "Not just an outfit,\na feeling"
  },
  {
    image: "/products/wedding-collection.jpg",
    eyebrow: "THE WEDDING EDIT",
    title: "Drape",
    title2: "Your Moment",
    subtitle: "Celebration-ready sarees with heirloom character",
    caption: "Made for moments\nworth remembering"
  },
  {
    image: "/products/kanjivaram-silk.jpg",
    eyebrow: "HANDWOVEN HERITAGE",
    title: "Grace in",
    title2: "Every Weave",
    subtitle: "Silks, zari and timeless craftsmanship",
    caption: "Tradition,\nrefined"
  }
];

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className="relative min-h-[570px] overflow-hidden bg-[#f5eee5] lg:min-h-[650px]">
      {slides.map((item, index) => (
        <div
          key={item.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={index !== active}
        >
          <Image
            src={item.image}
            alt="Kalpana Sarees model wearing a traditional saree"
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center lg:object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5eee5] via-[#f5eee5]/90 to-transparent lg:from-[#f5eee5]/95 lg:via-[#f5eee5]/50 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#3f0b13]/10 via-transparent to-transparent" />
        </div>
      ))}

      <div className="relative mx-auto grid min-h-[570px] max-w-7xl items-center px-6 lg:min-h-[650px] lg:grid-cols-2 lg:px-8">
        <div className="relative z-10 max-w-[600px] pt-10 lg:pt-0">
          <p className="text-[11px] font-semibold tracking-[.42em] text-royal-gold">
            {slide.eyebrow}
          </p>

          <h1 className="mt-5 font-display text-[56px] leading-[.95] text-royal-burgundy sm:text-7xl lg:text-[82px]">
            {slide.title}
            <br />
            {slide.title2}
          </h1>

          <p className="mt-6 max-w-lg font-display text-2xl leading-tight text-[#5b5552] sm:text-3xl">
            {slide.subtitle}
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-md bg-royal-burgundy px-7 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#320810]"
          >
            Shop Collection <span className="ml-2">→</span>
          </Link>

          <div className="mt-8 grid max-w-xl grid-cols-3 border-t border-black/10 pt-6">
            <div className="pr-4">
              <div className="text-lg text-royal-burgundy">▱</div>
              <div className="mt-2 text-xs font-semibold">Free Shipping</div>
              <div className="text-[11px] text-black/45">Above ₹1,999</div>
            </div>
            <div className="border-l border-black/10 px-4">
              <div className="text-lg text-royal-burgundy">♡</div>
              <div className="mt-2 text-xs font-semibold">Secure Payments</div>
              <div className="text-[11px] text-black/45">100% protected</div>
            </div>
            <div className="border-l border-black/10 pl-4">
              <div className="text-lg text-royal-burgundy">↻</div>
              <div className="mt-2 text-xs font-semibold">Easy Returns</div>
              <div className="text-[11px] text-black/45">Within 7 Days</div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[54%] lg:block">
          <div className="absolute bottom-10 right-7 whitespace-pre-line text-right font-display text-3xl leading-tight text-white drop-shadow-lg">
            {slide.caption}
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous hero slide"
        onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-royal-burgundy shadow-md backdrop-blur transition hover:bg-white"
      >
        ‹
      </button>

      <button
        type="button"
        aria-label="Next hero slide"
        onClick={() => setActive((current) => (current + 1) % slides.length)}
        className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-royal-burgundy shadow-md backdrop-blur transition hover:bg-white"
      >
        ›
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all ${
              active === index ? "w-8 bg-royal-gold" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
