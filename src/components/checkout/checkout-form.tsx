"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/input";
import {
  COUNTRIES,
  EMPTY_CHECKOUT_FORM,
  US_STATES,
  postalLabel,
  regionLabel,
  validateAll,
  validateField,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutFormValues,
} from "@/lib/checkout-validation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { splitName, type SessionUser } from "@/lib/auth/types";
import type { ShippingMethodId } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { PaymentPlaceholder } from "./payment-placeholder";
import { ShippingMethodPicker } from "./shipping-method-picker";

const FIELD_LABELS: Record<CheckoutField, string> = {
  email: "Email",
  phone: "Phone",
  marketingOptIn: "Marketing",
  firstName: "First name",
  lastName: "Last name",
  address1: "Address",
  address2: "Apartment",
  city: "City",
  region: "State / region",
  postalCode: "Postal code",
  country: "Country",
};

export function CheckoutForm({
  user,
  shippingMethodId,
  onShippingMethodChange,
  discountedSubtotal,
  total,
  submitting,
  submitError,
  onDismissError,
  onSubmit,
}: {
  user: SessionUser;
  shippingMethodId: ShippingMethodId;
  onShippingMethodChange: (id: ShippingMethodId) => void;
  discountedSubtotal: number;
  total: number;
  submitting: boolean;
  submitError: string | null;
  onDismissError: () => void;
  onSubmit: (values: CheckoutFormValues, opts: { simulateFailure: boolean }) => void;
}) {
  const [values, setValues] = useState<CheckoutFormValues>(() => ({
    ...EMPTY_CHECKOUT_FORM,
    email: user.email,
    ...splitName(user.fullName),
  }));
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Move focus to the error summary after each failed submit so screen readers announce it.
  useEffect(() => {
    if (failedAttempts) summaryRef.current?.focus();
  }, [failedAttempts]);

  function set<K extends CheckoutField>(field: K, value: CheckoutFormValues[K]) {
    const next = { ...values, [field]: value };
    if (field === "country") next.region = "";
    setValues(next);
    // Re-validate live once a field has been touched, so errors clear as the user fixes them.
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, next) }));
  }

  function blur(field: CheckoutField) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, values) }));
  }

  function fieldProps(field: Exclude<CheckoutField, "marketingOptIn">) {
    return {
      name: field,
      value: values[field],
      error: touched[field] ? errors[field] : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(field, e.target.value),
      onBlur: () => blur(field),
      disabled: submitting,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const all = validateAll(values);
    const fields = Object.keys(all) as CheckoutField[];
    setErrors(all);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (fields.length) {
      setShowSummary(true);
      setFailedAttempts((n) => n + 1);
      return;
    }
    setShowSummary(false);
    onSubmit(values, { simulateFailure });
  }

  const errorEntries = (Object.entries(errors) as [CheckoutField, string | undefined][]).filter(([, msg]) => msg);
  const isUS = values.country === "US";

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby={submitError ? "checkout-error" : undefined}>
      {submitError && (
        <div
          id="checkout-error"
          role="alert"
          className="mb-8 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-tint p-4 text-sm text-danger"
        >
          <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">We couldn&apos;t place your order</p>
            <p className="mt-1 text-danger/90">{submitError}</p>
          </div>
          <button type="button" onClick={onDismissError} className="text-[0.8125rem] font-medium underline underline-offset-4">
            Dismiss
          </button>
        </div>
      )}

      {showSummary && errorEntries.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mb-8 rounded-2xl border border-danger/25 bg-danger-tint p-4 text-sm text-danger outline-none"
        >
          <p className="flex items-center gap-2 font-medium">
            <AlertCircle className="size-4.5" aria-hidden />
            Please fix {errorEntries.length === 1 ? "1 field" : `${errorEntries.length} fields`} to continue
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-6.5">
            {errorEntries.map(([field]) => (
              <li key={field}>
                <a
                  href={`#field-${field}`}
                  className="underline underline-offset-4 hover:text-danger/80"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`field-${field}`)?.focus();
                  }}
                >
                  {FIELD_LABELS[field]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset disabled={submitting} className="flex flex-col gap-12">
        <Step number={1} title="Contact" description="Your confirmation will be sent to your Google email.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle px-3.5 py-3 sm:col-span-2">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small remote avatar, no optimization needed
                <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full" />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
                  {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user.fullName ?? "Signed in"}</p>
                <p className="truncate text-[0.8125rem] text-ink-muted">{user.email}</p>
              </div>
              <SignOutButton className="shrink-0 text-[0.8125rem] font-medium text-ink underline underline-offset-4 hover:text-ink-soft">
                Not you?
              </SignOutButton>
            </div>
            <Input
              id="field-phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              optional
              hint="For delivery updates only."
              className="sm:col-span-2"
              {...fieldProps("phone")}
            />
            <Checkbox
              className="sm:col-span-2"
              label="Email me about new arrivals and exclusive offers"
              checked={values.marketingOptIn}
              onChange={(e) => set("marketingOptIn", e.target.checked)}
            />
          </div>
        </Step>

        <Step number={2} title="Shipping address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="field-country"
              label="Country"
              autoComplete="country"
              options={COUNTRIES}
              className="sm:col-span-2"
              {...fieldProps("country")}
            />
            <Input id="field-firstName" label="First name" autoComplete="given-name" {...fieldProps("firstName")} />
            <Input id="field-lastName" label="Last name" autoComplete="family-name" {...fieldProps("lastName")} />
            <Input
              id="field-address1"
              label="Address"
              autoComplete="address-line1"
              placeholder="Street address"
              className="sm:col-span-2"
              {...fieldProps("address1")}
            />
            <Input
              id="field-address2"
              label="Apartment, suite, etc."
              autoComplete="address-line2"
              optional
              className="sm:col-span-2"
              {...fieldProps("address2")}
            />
            <Input id="field-city" label="City" autoComplete="address-level2" className="sm:col-span-2 lg:col-span-1" {...fieldProps("city")} />
            <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-1">
              {isUS ? (
                <Select
                  id="field-region"
                  label={regionLabel(values.country)}
                  autoComplete="address-level1"
                  options={US_STATES}
                  placeholder="Select"
                  {...fieldProps("region")}
                />
              ) : (
                <Input id="field-region" label={regionLabel(values.country)} autoComplete="address-level1" {...fieldProps("region")} />
              )}
              <Input
                id="field-postalCode"
                label={postalLabel(values.country)}
                autoComplete="postal-code"
                inputMode={isUS ? "numeric" : "text"}
                {...fieldProps("postalCode")}
              />
            </div>
          </div>
        </Step>

        <Step number={3} title="Delivery method">
          <ShippingMethodPicker
            value={shippingMethodId}
            onChange={onShippingMethodChange}
            subtotal={discountedSubtotal}
            disabled={submitting}
          />
        </Step>

        <Step number={4} title="Payment" description="All transactions are secure and encrypted.">
          <PaymentPlaceholder simulateFailure={simulateFailure} onSimulateFailureChange={setSimulateFailure} disabled={submitting} />
        </Step>
      </fieldset>

      <div className="mt-10 border-t border-line pt-8">
        <Button type="submit" size="lg" className="h-14 w-full text-base" loading={submitting} loadingText="Placing order…">
          <Lock className="size-4" /> Place order · {formatPrice(total)}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
          By placing your order you agree to our Terms of Sale and acknowledge our Privacy Policy.
        </p>
      </div>
    </form>
  );
}

function Step({ number, title, description, children }: { number: number; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${number}`}>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{number}</span>
        <div>
          <h2 id={`step-${number}`} className="text-xl font-medium tracking-tight text-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
