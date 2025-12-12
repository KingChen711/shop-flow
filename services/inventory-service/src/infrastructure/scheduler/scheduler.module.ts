import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReservationExpiryScheduler } from './reservation-expiry.scheduler';
import { InventoryModule } from '@domain/inventory.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [ScheduleModule.forRoot(), InventoryModule, CqrsModule],
  providers: [ReservationExpiryScheduler],
  exports: [ReservationExpiryScheduler],
})
export class SchedulerModule {}
