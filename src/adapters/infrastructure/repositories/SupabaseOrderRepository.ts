import { Order } from '../../../core/domain/entities/Order.js';
import { OrderStatus } from '../../../core/domain/enums/OrderStatus.js';
import { PaymentMethod } from '../../../core/domain/enums/PaymentMethod.js';
import { PaymentStatus } from '../../../core/domain/enums/PaymentStatus.js';
import { OrderItem } from '../../../core/domain/value-objects/OrderItem.js';
import { IOrderRepository } from '../../../core/ports/IOrderRepository.js';
import { getSupabaseClient } from '../supabase/supabaseClient.js';

function mapRowToOrder(row: any): Order {
  const items: OrderItem[] = (row.order_items || []).map((it: any) => ({
    menuItemId: it.menu_item_id,
    name: it.item_name,
    unitPrice: Number(it.unit_price),
    quantity: Number(it.quantity),
    requiresCooking: Boolean(it.requires_cooking),
    notes: it.kitchen_notes || undefined
  }));

  const payment = Array.isArray(row.payments) && row.payments.length > 0 ? row.payments[0] : null;
  const invoice = Array.isArray(row.invoices) && row.invoices.length > 0 ? row.invoices[0] : null;

  const order: Order = {
    id: row.id,
    orderNumber: row.order_number,
    tableNumber: row.table_number,
    customerName: row.customer_name || 'Comensal',
    items,
    packaging: {
      bags: Boolean(row.packaging_bags),
      plasticContainers: Boolean(row.packaging_plastic),
      cutleryCount: Number(row.cutlery_count || 0)
    },
    status: row.status as OrderStatus,
    paymentStatus: (payment?.status || (payment?.method === 'CASH' ? PaymentStatus.PENDING_CASH : PaymentStatus.PAID)) as PaymentStatus,
    paymentMethod: (payment?.method || PaymentMethod.STRIPE_CARD) as PaymentMethod,
    subtotal: Number(row.subtotal),
    packagingCost: Number(row.packaging_fee || 0),
    tipAmount: Number(row.tip_amount || 0),
    total: Number(row.total),
    waiterId: row.waiter_id || undefined,
    waiterName: row.waiter?.name || undefined,
    chefId: row.chef_id || undefined,
    chefName: row.chef?.name || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };

  if (invoice) {
    order.receiptType = 'INVOICE';
    order.invoiceDetails = {
      nifCif: invoice.customer_tax_id,
      legalName: invoice.customer_legal_name,
      address: invoice.customer_address,
      email: invoice.customer_email || ''
    };
  }

  return order;
}

export class SupabaseOrderRepository implements IOrderRepository {
  private client = getSupabaseClient();

  async create(order: Order): Promise<Order> {
    // 1. Insert main order row
    const orderRow = {
      id: order.id,
      order_number: order.orderNumber,
      table_number: order.tableNumber,
      customer_name: order.customerName || 'Comensal',
      status: order.status,
      waiter_id: order.waiterId || null,
      chef_id: order.chefId || null,
      subtotal: order.subtotal,
      tip_amount: order.tipAmount || 0,
      packaging_bags: Boolean(order.packaging?.bags),
      packaging_plastic: Boolean(order.packaging?.plasticContainers),
      cutlery_count: order.packaging?.cutleryCount || 0,
      packaging_fee: order.packagingCost || 0,
      total: order.total,
      created_at: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      updated_at: order.updatedAt ? new Date(order.updatedAt).toISOString() : new Date().toISOString()
    };

    const { error: orderError } = await this.client
      .from('orders')
      .insert(orderRow);

    if (orderError) {
      console.error('Error creating order in Supabase:', orderError);
      throw new Error(`Error en Supabase al crear la comanda: ${orderError.message}`);
    }

    // 2. Insert order items
    if (order.items && order.items.length > 0) {
      const itemsRows = order.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        requires_cooking: Boolean(item.requiresCooking),
        kitchen_notes: item.notes || null
      }));

      const { error: itemsError } = await this.client
        .from('order_items')
        .insert(itemsRows);

      if (itemsError) {
        console.error('Error inserting order items in Supabase:', itemsError);
      }
    }

    // 3. Insert payment
    const paymentRow = {
      order_id: order.id,
      method: order.paymentMethod || 'STRIPE_CARD',
      status: order.paymentStatus || (order.paymentMethod === PaymentMethod.CASH ? 'PENDING_CASH' : 'PAID'),
      amount: order.total,
      gateway_transaction_id: order.paymentMethod === PaymentMethod.STRIPE_CARD ? `pi_mock_${order.id}` : null,
      paid_at: order.paymentStatus === PaymentStatus.PAID ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    const { error: paymentError } = await this.client
      .from('payments')
      .insert(paymentRow);

    if (paymentError) {
      console.error('Error inserting payment in Supabase:', paymentError);
    }

    // 4. Insert invoice if requested
    if (order.receiptType === 'INVOICE' && order.invoiceDetails) {
      const invoiceRow = {
        invoice_number: `INV-${order.orderNumber}`,
        order_id: order.id,
        customer_tax_id: order.invoiceDetails.nifCif,
        customer_legal_name: order.invoiceDetails.legalName,
        customer_address: order.invoiceDetails.address,
        customer_email: order.invoiceDetails.email || null,
        subtotal: order.subtotalNet || (order.subtotal / 1.1),
        vat_rate: 10.00,
        vat_amount: order.vatAmount || (order.subtotal - (order.subtotal / 1.1)),
        total_amount: order.total,
        issued_at: new Date().toISOString()
      };

      const { error: invoiceError } = await this.client
        .from('invoices')
        .insert(invoiceRow);

      if (invoiceError) {
        console.error('Error inserting invoice in Supabase:', invoiceError);
      }
    }

    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error(`Error finding order ${id} in Supabase:`, error);
      throw new Error(`Error en Supabase al buscar comanda ${id}: ${error.message}`);
    }

    return data ? mapRowToOrder(data) : null;
  }

  async findAll(): Promise<Order[]> {
    const { data, error } = await this.client
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all orders from Supabase:', error);
      throw new Error(`Error en Supabase al obtener comandas: ${error.message}`);
    }

    return (data || []).map(mapRowToOrder);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { error } = await this.client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Error updating status for order ${id} in Supabase:`, error);
      throw new Error(`Error en Supabase al cambiar estado de ${id}: ${error.message}`);
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Comanda ${id} no encontrada tras actualizar.`);
    return updated;
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    const isPaid = status === PaymentStatus.PAID;
    const { error: paymentError } = await this.client
      .from('payments')
      .update({
        status,
        paid_at: isPaid ? new Date().toISOString() : null
      })
      .eq('order_id', id);

    if (paymentError) {
      console.error(`Error updating payment for order ${id} in Supabase:`, paymentError);
      throw new Error(`Error al actualizar pago de ${id} en Supabase: ${paymentError.message}`);
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Comanda ${id} no encontrada tras actualizar pago.`);
    return updated;
  }

  async assignStaff(id: string, waiterId?: string, waiterName?: string, chefId?: string, chefName?: string): Promise<Order> {
    const updates: any = { updated_at: new Date().toISOString() };
    if (waiterId !== undefined) updates.waiter_id = waiterId;
    if (chefId !== undefined) updates.chef_id = chefId;

    const { error } = await this.client
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error(`Error assigning staff to order ${id} in Supabase:`, error);
      throw new Error(`Error al asignar personal a comanda ${id}: ${error.message}`);
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Comanda ${id} no encontrada tras asignar personal.`);
    if (waiterName) updated.waiterName = waiterName;
    if (chefName) updated.chefName = chefName;
    return updated;
  }
}
