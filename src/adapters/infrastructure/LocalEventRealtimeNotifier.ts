import { Order } from '../../core/domain/entities/Order.js';
import { IRealtimeNotifier } from '../../core/ports/IRealtimeNotifier.js';

export class LocalEventRealtimeNotifier implements IRealtimeNotifier {
  private listeners: ((order: Order) => void)[] = [];

  notifyOrderUpdate(order: Order): void {
    for (const listener of this.listeners) {
      try {
        listener(order);
      } catch (err) {
        console.error('Error in order event listener:', err);
      }
    }
  }

  subscribe(listener: (order: Order) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
