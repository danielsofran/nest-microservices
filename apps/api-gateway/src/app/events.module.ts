import { Module } from "@nestjs/common"
import { EventsGateway } from "./events.gateway"
import { EventsService } from "./events.service"

@Module({
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {
  // This module is responsible for handling events in the application.
}
