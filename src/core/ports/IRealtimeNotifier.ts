import { Order } from '../domain/entities/Order.js';

export interface IRealtimeNotifier {
  notifyOrderUpdate(order: Order): void;
  subscribe(listener: (order: Order) => void): () => void;
}
