# Compliance Runbook — Mama Lucica

> **DISCLAIMER**: This is engineering scaffolding, NOT legal certification.
> All legal documents are **DRAFT** and require review by a Romanian lawyer.

## How to enable/disable each marketing network safely

All marketing platforms are configured in `src/config/marketing-tech.ts` and
driven by `site_settings.general` keys in the database.

### Supported platforms

| Platform | DB Key (`site_settings.general`) | Consent Category |
|----------|----------------------------------|-----------------|
| Meta (Facebook) | `facebook_pixel_id` | marketing |
| Google Analytics 4 | `google_analytics_id` | analytics |
| Google Ads | `google_ads_id` | marketing |
| TikTok | `tiktok_pixel_id` | marketing |
| Pinterest | `pinterest_tag_id` | marketing |
| Snapchat | `snapchat_pixel_id` | marketing |
| LinkedIn | `linkedin_partner_id` | marketing |
| Microsoft Ads | `microsoft_uet_id` | marketing |
| Microsoft Clarity | `clarity_id` | analytics |

### Enabling a platform
1. Go to **Admin → Settings** and enter the platform's tracking ID
2. The Privacy Policy, Cookie Policy, and CMP banner automatically update
3. Scripts are blocked until user consents to the relevant category

### Disabling a platform
1. Remove or clear the tracking ID from Admin → Settings
2. The platform is automatically removed from all legal pages and CMP

### Verification
- Visit `/admin/compliance-inventory` to see which platforms are active
- Export JSON for lawyer/accountant review
- Run `node scripts/compliance-grep.mjs --fail-on-error` to verify no forbidden strings

## VAT Mode

Controlled by `site_settings.general.is_vat_payer` (default: `false`).

- When `false`: No TVA/VAT strings may appear anywhere in the UI
- When `true`: VAT lines show on invoices, price labels show "cu TVA inclus"
- The compliance grep script catches violations automatically

## Consent Management

- Consent data stored in `marketing_consents` table (DB)
- Local copy in `localStorage` key `cookie_consent`
- Policy version tracked via `CONSENT_POLICY_VERSION` in `marketing-tech.ts`
- Bump version when Privacy/Cookie policy changes materially

## Company Information

**Single source of truth**: `useCompanyInfo()` hook reads from `site_settings`.
Never hardcode CUI, IBAN, Reg.Com, or address in components.

The compliance grep script (`scripts/compliance-grep.mjs`) catches any hardcoded
company identifiers outside the allowed files.

## Legal Pages — Canonical URLs

| Page | Canonical URL |
|------|--------------|
| Terms & Conditions | `/termeni-si-conditii` |
| Privacy Policy | `/politica-confidentialitate` |
| Cookie Policy | `/politica-cookies` |
| Return Policy | `/politica-returnare` |
| Withdrawal Form | `/formular-retragere` |

Legacy paths (e.g. `/page/politica-retur`) redirect 301 to canonical URLs.

## Monitoring

- `/api/public/monitors/smoke` — lightweight health check (no secrets exposed)
- `/api/public/health` — basic health endpoint
- `/admin/compliance-report` — full compliance audit view
- `/admin/compliance-inventory` — marketing stack inventory

## CI Integration

Add to CI pipeline:
```bash
node scripts/compliance-grep.mjs --fail-on-error
```

This checks for:
- Hardcoded company identifiers (CUI, IBAN, Reg.Com)
- VAT strings when `IS_VAT_PAYER_DEFAULT=false`
