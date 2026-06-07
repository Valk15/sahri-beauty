-- SAHRI SKIN — Catalog, packs, scents, COD orders

-- ── Scents (8 launch fragrances) ─────────────────────────────
CREATE TABLE public.scents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code smallint NOT NULL UNIQUE CHECK (code BETWEEN 1 AND 99),
  slug text NOT NULL UNIQUE,
  name_fr text NOT NULL UNIQUE,
  profile_fr text NOT NULL,
  mood_fr text,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  subtitle_fr text,
  description_short text,
  description_long text,
  price_mad numeric(10,2),
  price_label text,
  role_in_pack text,
  badge text,
  image_path text,
  page_path text,
  sort_order smallint NOT NULL DEFAULT 0,
  requires_scent boolean NOT NULL DEFAULT false,
  sold_separately boolean NOT NULL DEFAULT true,
  is_gift boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Packs ────────────────────────────────────────────────────
CREATE TABLE public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  subtitle_fr text,
  description_short text,
  price_standard_mad numeric(10,2) NOT NULL,
  price_gift_mad numeric(10,2),
  separate_total_mad numeric(10,2),
  savings_mad numeric(10,2),
  page_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity smallint NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sort_order smallint NOT NULL DEFAULT 0,
  is_gift boolean NOT NULL DEFAULT false,
  UNIQUE (pack_id, product_id)
);

-- ── Orders (COD) ─────────────────────────────────────────────
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'returned',
  'cancelled'
);

CREATE TYPE public.order_format AS ENUM (
  'pack_standard',
  'pack_gift',
  'product_refill'
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  scent_id uuid REFERENCES public.scents(id) ON DELETE SET NULL,
  scent_name text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  pack_id uuid REFERENCES public.packs(id) ON DELETE SET NULL,
  product_name text,
  format public.order_format NOT NULL DEFAULT 'pack_standard',
  total_mad numeric(10,2) NOT NULL,
  notes text,
  status public.order_status NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (status);
CREATE INDEX orders_phone_idx ON public.orders (phone);

-- ── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER packs_updated_at
  BEFORE UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Seed: scents ─────────────────────────────────────────────
INSERT INTO public.scents (code, slug, name_fr, profile_fr, mood_fr, sort_order) VALUES
  (1, 'fruits-rouges', 'Fruits Rouges', 'Baies rouges, floraux frais, musc léger', 'Vif, fruité, énergisant', 1),
  (2, 'vanille-doree', 'Vanille Dorée', 'Vanille chaude, ambre, caramel', 'Cozy, doux, réconfortant', 2),
  (3, 'musc-blanc', 'Musc Blanc', 'Musc blanc propre, peau nue', 'Pur, intime, sophistiqué', 3),
  (4, 'nuit-noire', 'Nuit Noire', 'Floral foncé café, vanille, patchouli', 'Intense, sensuel, soirée', 4),
  (5, 'rose-satinee', 'Rose Satinée', 'Rose douce, pivoine, musc — féminin et léger', 'Délicat, féminin, romantique', 5),
  (6, 'coco-velours', 'Coco Velours', 'Noix de coco, vanille tiède, tropical léger', 'Chaud, tropical, enveloppant', 6),
  (7, 'ambre-doux', 'Ambre Doux', 'Ambre doux, bois de santal, base oud léger', 'Chaud, boisé, élégant', 7),
  (8, 'jasmin-soleil', 'Jasmin Soleil', 'Jasmin blanc, bergamote, finition propre', 'Frais, lumineux, aérien', 8);

-- ── Seed: products ───────────────────────────────────────────
INSERT INTO public.products (
  slug, name_fr, subtitle_fr, description_short, price_mad, price_label,
  role_in_pack, badge, image_path, page_path, sort_order,
  requires_scent, sold_separately, is_gift
) VALUES
  (
    'argan-parfumee-100ml',
    'Argan Parfumée',
    'Huile corps & cheveux — dans ton parfum',
    'Huile naturelle corps & cheveux. À base d''argan marocain. Parfumée dans ta fragrance au choix.',
    109, '109 MAD',
    'Héros — corps & cheveux, parfumé',
    'best-seller',
    'products/argan-parfumee-100ml/argan-parfumee-100ml-studio.png',
    'products/argan-parfumee-100ml/',
    1, true, true, false
  ),
  (
    'beurre-corporelle-200g',
    'Beurre Corporel',
    'Le beurre qui scelle ton parfum sur la peau',
    'Beurre corps naturel. Texture crémeuse veloutée. Hydratation longue durée. Parfumé dans ta fragrance.',
    119, '119 MAD',
    'Héros texture — hydratation profonde',
    'best-seller',
    'products/beurre-corporelle-200g/beurre-corporelle-200g-studio.png',
    'products/beurre-corporelle-200g/',
    2, true, true, false
  ),
  (
    'gommage-corps-300g',
    'Gommage Corps',
    'Le gommage qui prépare ta peau à absorber le rituel',
    'Gommage corps naturel. Exfoliation douce. Prépare la peau à absorber le rituel.',
    99, '99 MAD',
    'Préparation — exfoliation avant le rituel',
    'rituel',
    'products/gommage-corps-300g/gommage-corps-300g-studio.png',
    'products/gommage-corps-300g/',
    3, false, true, false
  ),
  (
    'gommage-levres-30g',
    'Gommage à Lèvres',
    'Lèvres douces, soignées, parfumées',
    'Gommage lèvres naturel. Sucre fin, texture fondante. Le soin visage du rituel.',
    79, '79 MAD',
    'Soin visage — touche féminine, UGC',
    'ugc-favorite',
    'products/gommage-levres-30g/gommage-levres-30g-studio.png',
    'products/gommage-levres-30g/',
    4, false, true, false
  ),
  (
    'petit-savon-cadeau',
    'Petit Savon',
    'Le petit cadeau qui rend tout le pack spécial',
    'Savon naturel offert dans chaque pack. Parfumé dans la fragrance choisie.',
    NULL, 'Offert',
    'Cadeau offert — valeur perçue',
    'offert',
    'products/petit-savon-cadeau/petit-savon-cadeau-studio.png',
    'products/petit-savon-cadeau/',
    5, false, false, true
  );

-- ── Seed: pack ───────────────────────────────────────────────
INSERT INTO public.packs (
  slug, name_fr, subtitle_fr, description_short,
  price_standard_mad, price_gift_mad, separate_total_mad, savings_mad, page_path
) VALUES (
  'pack-rituel-v2',
  'Pack Rituel SAHRI SKIN',
  'Ton rituel corps complet — dans ton parfum',
  '5 produits naturels personnalisés dans le parfum de ton choix. Argan + Beurre + Gommages + Savon offert.',
  269, 319, 406, 137, 'pack/'
);

INSERT INTO public.pack_items (pack_id, product_id, quantity, sort_order, is_gift)
SELECT p.id, pr.id, 1, pr.sort_order, pr.is_gift
FROM public.packs p
CROSS JOIN public.products pr
WHERE p.slug = 'pack-rituel-v2'
  AND pr.slug IN (
    'argan-parfumee-100ml',
    'beurre-corporelle-200g',
    'gommage-corps-300g',
    'gommage-levres-30g',
    'petit-savon-cadeau'
  );

-- ── Public catalog view ──────────────────────────────────────
CREATE OR REPLACE VIEW public.catalog_products AS
SELECT
  id, slug, name_fr, subtitle_fr, description_short,
  price_mad, price_label, role_in_pack, badge,
  image_path, page_path, sort_order,
  requires_scent, sold_separately, is_gift, is_active
FROM public.products
WHERE is_active = true;

CREATE OR REPLACE VIEW public.catalog_pack AS
SELECT
  p.id, p.slug, p.name_fr, p.subtitle_fr, p.description_short,
  p.price_standard_mad, p.price_gift_mad, p.separate_total_mad, p.savings_mad, p.page_path,
  COALESCE(
    json_agg(
      json_build_object(
        'slug', pr.slug,
        'name_fr', pr.name_fr,
        'role_in_pack', pr.role_in_pack,
        'image_path', pr.image_path,
        'page_path', pr.page_path,
        'is_gift', pi.is_gift,
        'sort_order', pi.sort_order
      ) ORDER BY pi.sort_order
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'::json
  ) AS items
FROM public.packs p
LEFT JOIN public.pack_items pi ON pi.pack_id = p.id
LEFT JOIN public.products pr ON pr.id = pi.product_id
WHERE p.is_active = true
GROUP BY p.id;

-- ── Submit order (public RPC) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_order(
  p_customer_name text,
  p_phone text,
  p_city text,
  p_scent_name text DEFAULT NULL,
  p_product_slug text DEFAULT NULL,
  p_pack_slug text DEFAULT 'pack-rituel-v2',
  p_format text DEFAULT 'pack_standard',
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scent_id uuid;
  v_product_id uuid;
  v_pack_id uuid;
  v_total numeric(10,2);
  v_product_name text;
  v_order_id uuid;
  v_format public.order_format;
BEGIN
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nom invalide';
  END IF;
  IF length(trim(p_phone)) < 8 THEN
    RAISE EXCEPTION 'Téléphone invalide';
  END IF;
  IF length(trim(p_city)) < 2 THEN
    RAISE EXCEPTION 'Ville invalide';
  END IF;

  IF p_scent_name IS NOT NULL AND length(trim(p_scent_name)) > 0 THEN
    SELECT id INTO v_scent_id FROM public.scents
    WHERE name_fr = trim(p_scent_name) AND is_active = true;
  END IF;

  v_format := p_format::public.order_format;

  IF p_product_slug IS NOT NULL AND length(trim(p_product_slug)) > 0 THEN
    SELECT id, name_fr, price_mad INTO v_product_id, v_product_name, v_total
    FROM public.products
    WHERE slug = trim(p_product_slug) AND is_active = true AND sold_separately = true;

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Produit introuvable';
    END IF;
    IF (SELECT requires_scent FROM public.products WHERE id = v_product_id) AND v_scent_id IS NULL THEN
      RAISE EXCEPTION 'Parfum requis pour ce produit';
    END IF;
    v_format := 'product_refill';
  ELSE
    SELECT id, price_standard_mad, price_gift_mad INTO v_pack_id, v_total, v_total
    FROM public.packs
    WHERE slug = COALESCE(NULLIF(trim(p_pack_slug), ''), 'pack-rituel-v2') AND is_active = true;

    IF v_pack_id IS NULL THEN
      RAISE EXCEPTION 'Pack introuvable';
    END IF;

    SELECT CASE v_format
      WHEN 'pack_gift' THEN price_gift_mad
      ELSE price_standard_mad
    END INTO v_total
    FROM public.packs WHERE id = v_pack_id;

    v_product_name := (SELECT name_fr FROM public.packs WHERE id = v_pack_id);

    IF v_scent_id IS NULL THEN
      RAISE EXCEPTION 'Parfum requis pour le pack';
    END IF;
  END IF;

  INSERT INTO public.orders (
    customer_name, phone, city,
    scent_id, scent_name,
    product_id, pack_id, product_name,
    format, total_mad, notes
  ) VALUES (
    trim(p_customer_name), trim(p_phone), trim(p_city),
    v_scent_id, NULLIF(trim(p_scent_name), ''),
    v_product_id, v_pack_id, v_product_name,
    v_format, v_total, NULLIF(trim(p_notes), '')
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.scents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active scents"
  ON public.scents FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read active packs"
  ON public.packs FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read pack items"
  ON public.pack_items FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.catalog_products TO anon, authenticated;
GRANT SELECT ON public.catalog_pack TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order TO anon, authenticated;
