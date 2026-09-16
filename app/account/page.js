"use client";

import Header from "../../components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { emptyProfile, readProfile, writeProfile } from "../../lib/profile";

export default function AccountPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => setProfile(readProfile()), []);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function save() {
    writeProfile(profile);
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-royal-cream">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.35em] text-royal-burgundy">My Kalpana</p>
            <h1 className="mt-3 font-display text-5xl text-royal-burgundy">Customer Profile</h1>
          </div>
          <Link href="/cart" className="text-sm underline underline-offset-4">View shopping bag</Link>
        </div>

        {saved ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Profile saved on this device.
          </div>
        ) : null}

        <div className="mt-8 rounded-[2rem] bg-white p-7 shadow-luxury">
          <h2 className="font-display text-3xl text-royal-burgundy">Personal details</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input placeholder="Full name" value={profile.name} onChange={(e) => update("name", e.target.value)} />
            <input type="email" placeholder="Email address" value={profile.email} onChange={(e) => update("email", e.target.value)} />
            <input placeholder="Mobile number" value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-7 shadow-luxury">
          <h2 className="font-display text-3xl text-royal-burgundy">Delivery address</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="md:col-span-2" placeholder="Address line 1" value={profile.address1} onChange={(e) => update("address1", e.target.value)} />
            <input className="md:col-span-2" placeholder="Apartment / landmark" value={profile.address2} onChange={(e) => update("address2", e.target.value)} />
            <input placeholder="City" value={profile.city} onChange={(e) => update("city", e.target.value)} />
            <input placeholder="State" value={profile.state} onChange={(e) => update("state", e.target.value)} />
            <input inputMode="numeric" maxLength={6} placeholder="PIN code" value={profile.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
        </div>

        <button onClick={save} className="mt-7 rounded-full bg-royal-burgundy px-8 py-4 text-sm font-semibold text-white hover:bg-royal-wine">
          Save Profile
        </button>

        <div className="mt-10 rounded-3xl border border-black/5 bg-white/70 p-6 text-sm leading-7 text-black/55">
          Your profile can be used to pre-fill checkout. This prototype stores the profile locally;
          production authentication should move these details to your server-side user account.
        </div>
      </div>
    </main>
  );
}
