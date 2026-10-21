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
  transactionId?: string;
  subtotal: number;
  subtotalNet?: number;
  vatAmount?: number;
  packagingCost?: number;
  tipAmount: number;
  total: number;
  waiterId?: string;
  waiterName?: string;
  chefId?: string;
  chefName?: string;
  receiptType?: 'TICKET' | 'INVOICE';
  invoiceDetails?: {
    nifCif: string;
    legalName: string;
    address: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
