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
import { ApiMenuRepository } from '../repositories/ApiMenuRepository.js';
import { ApiOrderRepository } from '../repositories/ApiOrderRepository.js';
import { ApiUserRepository } from '../repositories/ApiUserRepository.js';
import { ApiPaymentGateway } from '../repositories/ApiPaymentGateway.js';

export interface AppServices {
  menuRepo: IMenuRepository;
  orderRepo: IOrderRepository;
  userRepo: IUserRepository;
  paymentGateway: IPaymentGateway;
  realtimeNotifier: IRealtimeNotifier;
}

export class RepositoryContainer {
  private static instance: AppServices | null = null;

  static getServices(useMock?: boolean): AppServices {
    if (!this.instance) {
      let isMock = useMock;
      if (isMock === undefined) {
        const envMock = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_USE_MOCK_DB : undefined;
        isMock = envMock === 'true';
      }

      if (isMock) {
        this.instance = {
          menuRepo: new JsonMenuRepository(),
          orderRepo: new JsonOrderRepository(),
          userRepo: new JsonUserRepository(),
          paymentGateway: new StripePaymentGatewayMock(),
          realtimeNotifier: new LocalEventRealtimeNotifier()
        };
      } else {
        console.info('🛡️ Inicializando repositorios protegidos a través del Servidor BFF (/api/*)');
        this.instance = {
          menuRepo: new ApiMenuRepository(),
          orderRepo: new ApiOrderRepository(),
          userRepo: new ApiUserRepository(),
          paymentGateway: new ApiPaymentGateway(),
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
