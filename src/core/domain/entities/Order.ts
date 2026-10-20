import { OrderStatus } from '../enums/OrderStatus.js';
import { PaymentMethod } from '../enums/PaymentMethod.js';
import { PaymentStatus } from '../enums/PaymentStatus.js';
import { OrderItem } from '../value-objects/OrderItem.js';
import { PackagingOptions } from '../value-objects/PackagingOptions.js';

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  packaging: PackagingOptions;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  packagingCost?: number;
  tipAmount: number;
  total: number;
  waiterId?: string;
  waiterName?: string;
  chefId?: string;
  chefName?: string;
  createdAt: Date;
  updatedAt: Date;
}
