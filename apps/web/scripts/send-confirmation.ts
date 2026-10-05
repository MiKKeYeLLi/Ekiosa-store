/**
 * (Re)send the confirmation email for an order, using the same code path as checkout.
 * Usage: npm run email:confirmation -- LM-123456
 * Note: emails already marked as sent are skipped.
 */
import { createAdminClient } from "../src/lib/supabase/admin";
import { sendOrderConfirmation } from "../src/lib/email/send-order-confirmation";

const number = process.argv[2];
if (!number) {
  console.error("Usage: npm run email:confirmation -- <order number>");
  process.exit(1);
}

async function main() {
  const { data, error } = await createAdminClient().from("orders").select("id, confirmation_email_sent_at").eq("number", number).single();
  if (error || !data) {
    console.error(`Order ${number} not found.`);
    process.exitCode = 1;
    return;
  }
  await sendOrderConfirmation(data.id);
  const { data: after } = await createAdminClient().from("orders").select("confirmation_email_sent_at").eq("id", data.id).single();
  console.log(after?.confirmation_email_sent_at ? `✓ Sent (recorded at ${after.confirmation_email_sent_at})` : "✗ Not sent — see the error above.");
}

main();
