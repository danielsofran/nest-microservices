import { Injectable } from "@nestjs/common"
import { EventsGateway } from "./events.gateway"
import { EventsType } from "./events.type"

@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  emitCreateEvent(resourceName: string, createdItem: any) {
    this.eventsGateway.emitEvent(resourceName, EventsType.CREATED, createdItem)
  }

  emitUpdateEvent(resourceName: string, updatedItem: any) {
    this.eventsGateway.emitEvent(resourceName, EventsType.UPDATED, updatedItem)
  }

  emitDeleteEvent(resourceName: string, deletedItem: any) {
    this.eventsGateway.emitEvent(resourceName, EventsType.DELETED, deletedItem)
  }
}
