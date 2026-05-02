# Beton ehf. — Vefsíða

Vefsíða fyrir **Beton ehf.** — ástandsskoðun fasteigna, staðsett í Hafnarfirði, Íslandi.

## Tæknistafli

- **Next.js 16** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** v4
- **React Hook Form** + **Zod** (form validation)
- **Resend** (email delivery)
- **Docker** (production deployment)

## Keyra á eigin vél

```bash
# Setja upp
pnpm install

# Búa til .env.local (sjá .env.example)
cp .env.example .env.local

# Keyra dev server
pnpm dev
```

Opnaðu [http://localhost:3000](http://localhost:3000) í vafranum.

## Umhverfisbreytur

| Breyta | Lýsing |
|---|---|
| `RESEND_API_KEY` | API lykill frá [resend.com](https://resend.com) til að senda tölvupóst |
| `SITE_PASSWORD` | Lykilorð til að vernda síðuna á meðan hún er í þróun. Eyða til að slökkva á vernd. |
| `CONTACT_EMAIL` | Netfang sem tekur á móti fyrirspurnum (sjálfgefið: beton@beton.is) |

## Uppsetning tölvupósts (Resend)

1. Búðu til aðgang á [resend.com](https://resend.com)
2. Staðfestu lén (betonehf.is) á Resend
3. Búðu til API lykil og settu í `RESEND_API_KEY`
4. Uppfærðu `from` í `src/app/api/contact/route.ts` í staðfest lén

## Dreifing (Docker / Coolify)

Vefsíðan er stillt fyrir `output: 'standalone'` og inniheldur Dockerfile.

```bash
# Byggja Docker mynd
docker build -t beton-web .

# Keyra
docker run -p 3000:3000 --env-file .env.local beton-web
```

Eða með docker-compose:

```bash
docker compose up -d
```

### Coolify uppsetning

1. Tengdu GitHub repo `vitvelar/beton-web`
2. Veldu Docker build pack
3. Settu umhverfisbreytur (RESEND_API_KEY, SITE_PASSWORD, CONTACT_EMAIL)
4. Settu lén: `beton.vitvelar.cloud`
5. Deploy

## Slökkva á lykilorðsvernd

Til að fjarlægja lykilorðsvernd þegar síðan fer í loftið:

1. Eyða `SITE_PASSWORD` úr umhverfisbreytum (eða setja tómt)
2. Endurræsa þjónustu

Proxy-ið sleppur öllu í gegn ef `SITE_PASSWORD` er ekki sett.

## Skipulag verkefnis

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.ts      # Login endpoint
│   │   └── contact/route.ts   # Contact form email
│   ├── login/page.tsx          # Password gate
│   ├── umokkur/page.tsx        # Um okkur
│   ├── verdskra/page.tsx       # Verðskrá
│   ├── samband/page.tsx        # Hafa samband
│   ├── skodun/page.tsx         # Bóka skoðun
│   ├── skilmalar/page.tsx      # Skilmálar
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Forsíða
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── HeroSection.tsx
│   ├── PricingCard.tsx
│   ├── ContactForm.tsx
│   ├── SectionHeading.tsx
│   └── Button.tsx
├── lib/
│   ├── constants.ts
│   └── schemas.ts
└── proxy.ts                    # Password protection proxy
```
