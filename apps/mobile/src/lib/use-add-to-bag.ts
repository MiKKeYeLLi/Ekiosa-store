import { useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { Product } from "@ekiosa/shared/types";
import { useToast } from "@/components/ui/toast";
import { useCart } from "./cart-store";

/** Add to bag with stock clamping, haptic feedback and a "View bag" toast. */
export function useAddToBag(product: Product | null | undefined) {
  const add = useCart((s) => s.add);
  const inBag = useCart((s) => (product ? (s.lines.find((l) => l.productId === product.id)?.quantity ?? 0) : 0));
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const remaining = product ? Math.max(product.stock - inBag, 0) : 0;

  function addToBag(quantity = 1) {
    if (!product) return;
    const added = add(product, quantity);
    if (added === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast({ tone: "error", title: "No more available", description: `You already have all ${product.stock} in your bag.` });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
    toast({
      title: "Added to your bag",
      description: added < quantity ? `${added} × ${product.name} (limited stock)` : `${added} × ${product.name}`,
      image: product.images[0]?.src,
      action: { label: "View bag", onPress: () => router.navigate("/bag") },
    });
  }

  return { addToBag, inBag, remaining, justAdded, soldOut: !product || product.stock <= 0 };
}
