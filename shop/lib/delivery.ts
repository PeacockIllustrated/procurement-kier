export const DELIVERY_THRESHOLD = 100;
export const DELIVERY_FEE_AMOUNT = 10;

/** Returns £10 delivery fee if subtotal is under £100, otherwise £0. */
export function calculateDeliveryFee(subtotal: number): number {
  return subtotal < DELIVERY_THRESHOLD ? DELIVERY_FEE_AMOUNT : 0;
}
