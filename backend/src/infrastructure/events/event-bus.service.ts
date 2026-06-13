import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DomainEvent } from '../../domain/common/domain-event';

@Injectable()
export class EventBusService {
  constructor(private readonly eventBus: EventBus) {}

  publish(event: DomainEvent): void {
    this.eventBus.publish(event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach((event) => this.eventBus.publish(event));
  }
}
