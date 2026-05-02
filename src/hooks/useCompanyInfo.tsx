/**
 * Single source of truth for company/legal identifiers.
 * Reads from the SAME site_settings (general + footer) used by SiteFooter.
 * NEVER hardcode these values in legal pages — always use this hook.
 */
import { useSiteSettings } from "@/hooks/useSiteSettings";

export interface CompanyInfo {
  name: string;
  cui: string;
  regCom: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  fullAddress: string;
  email: string;
  phone: string;
  site: string;
  iban: string;
  bank: string;
  schedule: string;
}

export function useCompanyInfo(): CompanyInfo {
  const { general, footer } = useSiteSettings();

  const companyAddress = general?.company_address || footer?.company_address || "Strada Constructorilor Nr 39, sat Voievoda, comuna Furculești";
  const city = general?.company_city || footer?.company_city || "Furculești";
  const county = general?.company_county || footer?.company_county || "Teleorman";
  const postalCode = general?.company_postal_code || footer?.company_postal_code || "147148";
  const fullAddress = [companyAddress, city, county, postalCode].filter(Boolean).join(", ");

  return {
    name: general?.company_name || footer?.company_name || "SC Vomix Genius SRL",
    cui: general?.company_cui || footer?.cui || "43025661",
    regCom: general?.reg_com || footer?.reg_com || "J2020000459343",
    address: companyAddress,
    city,
    county,
    postalCode,
    fullAddress,
    email: general?.contact_email || "contact@mamalucica.ro",
    phone: general?.contact_phone || "+40 753 326 405",
    site: "mamalucica.ro",
    iban: general?.invoice_iban || footer?.company_iban || "RO50BTRLRONCRT0566231601",
    bank: general?.invoice_bank || footer?.company_bank || "BANCA TRANSILVANIA S.A.",
    schedule: general?.contact_schedule || "Luni-Vineri 09:00-17:00",
  };
}
