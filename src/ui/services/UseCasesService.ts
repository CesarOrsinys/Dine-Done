import { RepositoryContainer } from '../../adapters/infrastructure/di/RepositoryContainer.js';
import { CreateOrderUseCase } from '../../core/usecases/CreateOrderUseCase.js';
import { UpdateOrderStatusUseCase } from '../../core/usecases/UpdateOrderStatusUseCase.js';
import { AssignStaffUseCase } from '../../core/usecases/AssignStaffUseCase.js';
import { ProcessCashPaymentUseCase } from '../../core/usecases/ProcessCashPaymentUseCase.js';
import { ManageStockUseCase } from '../../core/usecases/ManageStockUseCase.js';
import { GenerateKpiReportUseCase } from '../../core/usecases/GenerateKpiReportUseCase.js';

export const services = RepositoryContainer.getServices();
export const createOrderUseCase = new CreateOrderUseCase(services.orderRepo, services.menuRepo, services.paymentGateway, services.realtimeNotifier);
export const updateStatusUseCase = new UpdateOrderStatusUseCase(services.orderRepo, services.realtimeNotifier);
export const assignStaffUseCase = new AssignStaffUseCase(services.orderRepo, services.realtimeNotifier);
export const processCashUseCase = new ProcessCashPaymentUseCase(services.orderRepo, services.realtimeNotifier);
export const manageStockUseCase = new ManageStockUseCase(services.menuRepo);
export const kpiUseCase = new GenerateKpiReportUseCase(services.orderRepo);
