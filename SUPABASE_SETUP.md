# SAHRI SKIN — Supabase backend setup

Project: **SAHRI** · `vmfkhspwnxbdxzthvuxv`  
URL: `https://vmfkhspwnxbdxzthvuxv.supabase.co`

---

## 1. Run the database migration (one time)

**If you got `relation "scents" already exists` — use the SAFE script:**

1. Open [SQL Editor](https://supabase.com/dashboard/project/vmfkhspwnxbdxzthvuxv/sql/new)
2. Copy **`supabase/migrations/20260607130000_sahri_catalog_safe_rerun.sql`**
3. Paste → **Run** (safe to run multiple times)

You should see a result table at the bottom: scents=8, products=5, packs=1, pack_items=5.

**First time (empty database) — either script works:**
- `20260607120000_sahri_catalog_and_orders.sql` OR the safe rerun above.

---

## 2. Add your anon key to the site

1. Dashboard → **Settings** → **API**
2. Copy **anon public** key
3. Paste into `js/supabase-config.js`:

```javascript
window.SAHRI_CONFIG = {
  supabaseUrl: 'https://vmfkhspwnxbdxzthvuxv.supabase.co',
  supabaseAnonKey: 'eyJhbG...your-key-here'
};
```

4. Commit + push → Cloudflare redeploys automatically

---

## 3. What’s in the database

| Table | Purpose |
|-------|---------|
| `scents` | 8 parfums (Fruits Rouges → Jasmin Soleil) |
| `products` | 5 produits + prix + badges + images |
| `packs` | Pack Rituel v2 — 269 / 319 MAD |
| `pack_items` | Composition du pack |
| `orders` | Commandes COD du site |

| View / RPC | Purpose |
|------------|---------|
| `catalog_products` | Boutique frontend |
| `catalog_pack` | Page pack + économie |
| `submit_order()` | Enregistre une commande (public, sécurisé RLS) |

---

## 4. Produits seedés

| Slug | Nom | Prix MAD |
|------|-----|----------|
| `argan-parfumee-100ml` | Argan Parfumée | 109 |
| `beurre-corporelle-200g` | Beurre Corporel | 119 |
| `gommage-corps-300g` | Gommage Corps | 99 |
| `gommage-levres-30g` | Gommage à Lèvres | 79 |
| `petit-savon-cadeau` | Petit Savon | Offert |

**Pack Rituel v2:** 269 MAD standard · 319 MAD gift · économie 137 MAD

---

## 5. Gérer ton business dans Supabase

- **Table Editor** → modifier prix, activer/désactiver produits
- **orders** → suivre commandes (pending → confirmed → delivered)
- **Authentication** → plus tard pour admin dashboard

---

## 6. GitHub ↔ Supabase

Connect GitHub in Supabase for **migration sync** only (not frontend hosting).  
Frontend = Cloudflare Pages · Backend = Supabase · Code = GitHub.

---

## Security

- Never commit database password or `service_role` key
- `anon` key is safe in frontend (protected by RLS)
- Rotate DB password if `pass supabase.txt` was ever committed
