export interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  requiresCooking: boolean;
  notes?: string;
}
