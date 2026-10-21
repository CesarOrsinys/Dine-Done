import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const ordersRouter = Router();

function mapRowToOrder(row: any) {
  const items = (row.order_items || []).map((it: any) => ({
    menuItemId: it.menu_item_id,
    name: it.item_name,
    unitPrice: Number(it.unit_price),
    quantity: Number(it.quantity),
    requiresCooking: Boolean(it.requires_cooking),
    notes: it.kitchen_notes || undefined
  }));

  const payment = Array.isArray(row.payments) && row.payments.length > 0 ? row.payments[0] : null;
  const invoice = Array.isArray(row.invoices) && row.invoices.length > 0 ? row.invoices[0] : null;

  const order: any = {
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
    status: row.status,
    paymentStatus: payment?.status || (payment?.method === 'CASH' ? 'PENDING_CASH' : 'PAID'),
    paymentMethod: payment?.method || 'STRIPE_CARD',
    transactionId: payment?.gateway_transaction_id || undefined,
    subtotal: Number(row.subtotal),
    packagingCost: Number(row.packaging_fee || 0),
    tipAmount: Number(row.tip_amount || 0),
    total: Number(row.total),
    waiterId: row.waiter_id || undefined,
    waiterName: row.waiter?.name || undefined,
    chefId: row.chef_id || undefined,
    chefName: row.chef?.name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

// 1. Crear nuevo pedido (Público - Comensal en sala)
ordersRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = req.body;
    if (!order.id || !order.orderNumber || !order.tableNumber) {
      res.status(400).json({ error: 'Datos de comanda incompletos' });
      return;
    }

    // A. Insertar comanda principal
    const orderRow = {
      id: order.id,
      order_number: order.orderNumber,
      table_number: order.tableNumber,
      customer_name: order.customerName || 'Comensal',
      status: order.status || 'PLACED',
      waiter_id: order.waiterId || null,
      chef_id: order.chefId || null,
      subtotal: order.subtotal,
      tip_amount: order.tipAmount || 0,
      packaging_bags: Boolean(order.packaging?.bags),
      packaging_plastic: Boolean(order.packaging?.plasticContainers),
      cutlery_count: order.packaging?.cutleryCount || 0,
      packaging_fee: order.packagingCost || 0,
      total: order.total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: orderError } = await supabase.from('orders').insert(orderRow);
    if (orderError) throw orderError;

    // B. Insertar líneas del pedido
    if (order.items && order.items.length > 0) {
      const itemsRows = order.items.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        requires_cooking: Boolean(item.requiresCooking),
        kitchen_notes: item.notes || null
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsRows);
      if (itemsError) console.error('Error insertando líneas de pedido:', itemsError);
    }

    // C. Insertar registro de pago
    const paymentRow = {
      order_id: order.id,
      method: order.paymentMethod || 'STRIPE_CARD',
      status: order.paymentStatus || (order.paymentMethod === 'CASH' ? 'PENDING_CASH' : 'PAID'),
      amount: order.total,
      gateway_transaction_id: order.paymentMethod === 'STRIPE_CARD' ? (order.transactionId || `pi_emu_${order.id}`) : null,
      paid_at: order.paymentStatus === 'PAID' ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };
    const { error: paymentError } = await supabase.from('payments').insert(paymentRow);
    if (paymentError) console.error('Error insertando pago:', paymentError);

    // D. Deducir stock de la carta
    if (order.items && order.items.length > 0) {
      for (const it of order.items) {
        const { data: current } = await supabase.from('menu_items').select('stock').eq('id', it.menuItemId).single();
        if (current) {
          const newStock = Math.max(0, current.stock - it.quantity);
          await supabase.from('menu_items').update({ stock: newStock }).eq('id', it.menuItemId);
        }
      }
    }

    res.status(201).json(order);
  } catch (err: any) {
    console.error('Error en POST /api/orders:', err);
    res.status(500).json({ error: 'Error al registrar pedido' });
  }
});

// 2. Listar comandas (PROTEGIDO - Solo personal de restaurante)
ordersRouter.get('/', requireAuth, requireRole(['WAITER', 'CHEF', 'MANAGER']), async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((data || []).map(mapRowToOrder));
  } catch (err: any) {
    console.error('Error en GET /api/orders:', err);
    res.status(500).json({ error: 'Error al obtener comandas' });
  }
});

// 3. Actualizar estado de comanda (PROTEGIDO - Personal)
ordersRouter.patch('/:id/status', requireAuth, requireRole(['WAITER', 'CHEF', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    const { data: updated } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .eq('id', id)
      .single();

    res.json(mapRowToOrder(updated));
  } catch (err: any) {
    console.error('Error en PATCH /api/orders/:id/status:', err);
    res.status(500).json({ error: 'Error al actualizar estado del pedido' });
  }
});

// 4. Confirmar pago (PROTEGIDO - Camarero o Gerente)
ordersRouter.patch('/:id/payment', requireAuth, requireRole(['WAITER', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isPaid = status === 'PAID';

    const { error } = await supabase
      .from('payments')
      .update({
        status,
        paid_at: isPaid ? new Date().toISOString() : null
      })
      .eq('order_id', id);

    if (error) throw error;

    const { data: updated } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .eq('id', id)
      .single();

    res.json(mapRowToOrder(updated));
  } catch (err: any) {
    console.error('Error en PATCH /api/orders/:id/payment:', err);
    res.status(500).json({ error: 'Error al actualizar estado de pago' });
  }
});

// 5. Asignar personal (PROTEGIDO - Personal)
ordersRouter.patch('/:id/staff', requireAuth, requireRole(['WAITER', 'CHEF', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { waiterId, chefId } = req.body;
    const updates: any = { updated_at: new Date().toISOString() };
    if (waiterId !== undefined) updates.waiter_id = waiterId;
    if (chefId !== undefined) updates.chef_id = chefId;

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    const { data: updated } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*), invoices(*), waiter:waiter_id(name), chef:chef_id(name)')
      .eq('id', id)
      .single();

    res.json(mapRowToOrder(updated));
  } catch (err: any) {
    console.error('Error en PATCH /api/orders/:id/staff:', err);
    res.status(500).json({ error: 'Error al asignar personal a la comanda' });
  }
});
