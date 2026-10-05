/**
 * Client-side checkout validation. Mirror these rules on the server
 * (e.g. with a shared schema) once orders are persisted.
 */

export interface CheckoutFormValues {
  email: string;
  phone: string;
  marketingOptIn: boolean;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export type CheckoutField = keyof CheckoutFormValues;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "NG", label: "Nigeria" },
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD",
  "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
].map((s) => ({ value: s, label: s }));

export function regionLabel(country: string) {
  return country === "US" ? "State" : country === "CA" ? "Province" : country === "GB" ? "County" : "State / Region";
}

export function postalLabel(country: string) {
  return country === "US" ? "ZIP code" : "Postal code";
}

const POSTAL_PATTERNS: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
};

export const EMPTY_CHECKOUT_FORM: CheckoutFormValues = {
  email: "",
  phone: "",
  marketingOptIn: false,
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "US",
};

export function validateField(field: CheckoutField, values: CheckoutFormValues): string | undefined {
  const v = typeof values[field] === "string" ? (values[field] as string).trim() : values[field];
  switch (field) {
    case "email":
      if (!v) return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v as string)) return "Enter a valid email, like name@example.com.";
      return;
    case "phone":
      if (v && !/^\+?[\d\s().-]{7,20}$/.test(v as string)) return "Enter a valid phone number.";
      return;
    case "firstName":
      return v ? undefined : "Enter your first name.";
    case "lastName":
      return v ? undefined : "Enter your last name.";
    case "address1":
      if (!v) return "Enter your street address.";
      if ((v as string).length < 4) return "Address looks too short.";
      return;
    case "city":
      return v ? undefined : "Enter your city.";
    case "region":
      return v ? undefined : `Select or enter your ${regionLabel(values.country).toLowerCase()}.`;
    case "postalCode": {
      if (!v) return `Enter your ${postalLabel(values.country).toLowerCase()}.`;
      const pattern = POSTAL_PATTERNS[values.country] ?? /^[A-Za-z0-9 -]{3,10}$/;
      return pattern.test(v as string) ? undefined : `Enter a valid ${postalLabel(values.country).toLowerCase()}.`;
    }
    case "country":
      return v ? undefined : "Select your country.";
    default:
      return;
  }
}

export const VALIDATED_FIELDS: CheckoutField[] = [
  "email",
  "phone",
  "firstName",
  "lastName",
  "address1",
  "city",
  "country",
  "region",
  "postalCode",
];

export function validateAll(values: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const f of VALIDATED_FIELDS) {
    const e = validateField(f, values);
    if (e) errors[f] = e;
  }
  return errors;
}
