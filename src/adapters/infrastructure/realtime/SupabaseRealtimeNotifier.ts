import { Order } from '../../../core/domain/entities/Order.js';
import { IRealtimeNotifier } from '../../../core/ports/IRealtimeNotifier.js';
import { getSupabaseClient } from '../supabase/supabaseClient.js';
import { SupabaseOrderRepository } from '../repositories/SupabaseOrderRepository.js';

export class SupabaseRealtimeNotifier implements IRealtimeNotifier {
  private client = getSupabaseClient();
  private listeners: Set<(order: Order) => void> = new Set();
  private orderRepo = new SupabaseOrderRepository();
  private channel: any = null;

  constructor() {
    this.initRealtimeSubscription();
  }

  private initRealtimeSubscription() {
    try {
      this.channel = this.client
        .channel('dnd-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          async (payload: any) => {
            const orderId = payload.new?.id || payload.old?.id;
            if (orderId) {
              try {
                const fullOrder = await this.orderRepo.findById(orderId);
                if (fullOrder) {
                  this.listeners.forEach(listener => {
                    try {
                      listener(fullOrder);
                    } catch (e) {
                      console.error('Error in realtime listener callback:', e);
                    }
                  });
                }
              } catch (err) {
                console.warn('Realtime order lookup failed:', err);
              }
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Could not initialize Supabase Realtime channel, falling back to local events:', e);
    }
  }

  notifyOrderUpdate(order: Order): void {
    // Notify local subscribers immediately
    this.listeners.forEach(listener => {
      try {
        listener(order);
      } catch (e) {
        console.error('Error in realtime listener callback:', e);
      }
    });
  }

  subscribe(listener: (order: Order) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
