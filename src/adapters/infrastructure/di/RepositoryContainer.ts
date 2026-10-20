import { IMenuRepository } from '../../../core/ports/IMenuRepository.js';
import { IOrderRepository } from '../../../core/ports/IOrderRepository.js';
import { IPaymentGateway } from '../../../core/ports/IPaymentGateway.js';
import { IRealtimeNotifier } from '../../../core/ports/IRealtimeNotifier.js';
import { IUserRepository } from '../../../core/ports/IUserRepository.js';
import { LocalEventRealtimeNotifier } from '../LocalEventRealtimeNotifier.js';
import { JsonMenuRepository } from '../../storage/JsonMenuRepository.js';
import { JsonOrderRepository } from '../../storage/JsonOrderRepository.js';
import { JsonUserRepository } from '../../storage/JsonUserRepository.js';
import { StripePaymentGatewayMock } from '../../storage/StripePaymentGatewayMock.js';

export interface AppServices {
  menuRepo: IMenuRepository;
  orderRepo: IOrderRepository;
  userRepo: IUserRepository;
  paymentGateway: IPaymentGateway;
  realtimeNotifier: IRealtimeNotifier;
}

export class RepositoryContainer {
  private static instance: AppServices | null = null;

  static getServices(useMock: boolean = true): AppServices {
    if (!this.instance) {
      if (useMock) {
        this.instance = {
          menuRepo: new JsonMenuRepository(),
          orderRepo: new JsonOrderRepository(),
          userRepo: new JsonUserRepository(),
          paymentGateway: new StripePaymentGatewayMock(),
          realtimeNotifier: new LocalEventRealtimeNotifier()
        };
      } else {
        // Reserved for Phase 2 Supabase implementation
        console.warn('SupabaseAdapter will be initialized in Phase 2. Falling back to Mock.');
        this.instance = {
          menuRepo: new JsonMenuRepository(),
          orderRepo: new JsonOrderRepository(),
          userRepo: new JsonUserRepository(),
          paymentGateway: new StripePaymentGatewayMock(),
          realtimeNotifier: new LocalEventRealtimeNotifier()
        };
      }
    }
    return this.instance;
  }

  static reset() {
    this.instance = null;
  }
}
