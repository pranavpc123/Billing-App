# DELSORA — Billing & Business Management

A billing and business-management app for DELSORA Designer Boutique & Makeover Studio, built with Next.js, Prisma (Postgres), and NextAuth.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

**Note:** if `npm`/`npx` commands fail with a `Cannot find module ...npm-prefix.js` error, it's because this machine's `PATH` lists `nodejs\node_modules\npm\bin` before the correct `nodejs\` folder. Work around it per-command by prefixing with the correct path, e.g. in PowerShell:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

## Seeded logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@delsora.local | Delsora@123 |
| Manager | manager@delsora.local | Delsora@123 |
| Staff | staff@delsora.local | Delsora@123 |

Change these passwords from **Users** once you're ready to go live (an Admin account can also add real staff accounts there).

## Database

Postgres, hosted on Prisma Postgres (`DATABASE_URL` in `.env`). Useful commands:

```bash
npm run db:studio   # browse/edit data in Prisma Studio
npm run db:seed     # re-run the seed script (safe to run multiple times)
npm run db:reset    # wipe and reseed — destructive, asks for confirmation
```

Local dev and the deployed app share the same database unless you point `DATABASE_URL` at a different one — see [console.prisma.io](https://console.prisma.io) to manage it (backups, branches, a second database for a separate environment, etc.).

## Brand assets

`public/logo-mark.png` and `public/logo-card.png` were rasterized from the source PDFs in `scripts/rasterize-logo-assets.mjs` (re-run it if the source PDFs change — see the paths at the top of the script).

## Payments, Quotes, Google Sheets

- **Advance / pending payments**: the billing screen has an "Amount Received Now" field — leave it at the full total, or lower it to record an advance. The invoice shows a Paid / Partial / Pending badge and a Pending Balance; top it up later from the invoice's "Record Payment" box (Admin/Manager). The Dashboard's "Pending Payments" card totals every outstanding balance.
- **Quotes**: `/quotes` — separate pre-sale estimates (own `QT0001…` numbering) with print/PDF/WhatsApp share, that convert into a real invoice (picking payment method, visit mode, and amount received at that point) via the "Convert to Invoice" button.
- **Google Sheets sync** (Settings → Google Sheets Sync): optional, off by default. The app's own database always stays the source of truth — this only mirrors each invoice/quote to a spreadsheet as a shareable backup. To enable it:
  1. In Google Cloud Console, create a service account and enable the Google Sheets API for the project.
  2. Add its credentials to `.env`:
     ```
     GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
     GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     ```
     (keep the `\n` sequences literal — the app converts them to real newlines)
  3. Share your target Google Sheet with that service-account email as **Editor**.
  4. Paste the sheet's Spreadsheet ID (from its URL) into Settings, save, then use **Send Test Row** to confirm it's wired up before relying on it. "Invoices" and "Quotes" tabs are created automatically on first sync.

## WhatsApp sending

Every invoice and quote gets a secure, unguessable link (`/invoice/<number>/<random-token>` or `/quote/<number>/<random-token>`) that opens a no-login customer-facing page — view, print, or download the PDF. No customer login, no exposed sequential/database IDs; the random token is what actually protects it, not the number in the URL.

"Send Invoice/Quote on WhatsApp" builds a message from an admin-editable template (Settings → WhatsApp Sharing) containing that link, and opens WhatsApp with it pre-filled — staff review and press Send manually inside WhatsApp. This is deliberately **click-to-chat only**: no Meta WhatsApp API, no Cloud API, no Twilio, no paid integration, and nothing is ever sent without a human pressing Send.

**Public Base URL matters:** if you're running this locally (not deployed), a `localhost` link only opens on that same PC — a customer's phone can't reach it. Either access the app via this PC's LAN IP (e.g. `http://192.168.1.5:3000`) so links work automatically, or set **Public Base URL** in Settings → WhatsApp Sharing to whatever address does reach it (LAN IP, a tunnel like ngrok). Once deployed (see below), this isn't an issue — the app's real public URL is used automatically.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from there).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo.
3. Add these environment variables in the Vercel project settings (same values as `.env` locally):
   - `DATABASE_URL` — the Prisma Postgres connection string
   - `AUTH_SECRET` — generate a fresh one for production with `npx auth secret`, don't reuse the local dev one
   - Optionally `GOOGLE_SHEETS_CLIENT_EMAIL` / `GOOGLE_SHEETS_PRIVATE_KEY` if you use Sheets sync
4. Deploy. Vercel runs `npm run build`, which includes `postinstall: prisma generate`.

**Known limitation on Vercel:** the Settings → Logo upload is disabled there (Vercel's serverless functions have no writable/persistent disk) — the deployed app uses the DELSORA logo already committed to `public/`. To change it, update the file in the repo and redeploy, or ask your developer to.

## Known limitations

- The seeded business email (`delsora2017boutique@gamil.com`) is copied verbatim from the business card — it may be a typo for `gmail.com`. Update it from **Settings** if so.
