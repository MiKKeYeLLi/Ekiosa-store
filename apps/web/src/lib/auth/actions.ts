"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
