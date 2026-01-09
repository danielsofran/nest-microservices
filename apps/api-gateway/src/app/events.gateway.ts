import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets"
import { Server, Socket, Namespace } from "socket.io"
import { HttpException, Logger } from "@nestjs/common"

@WebSocketGateway({ namespace: /\/[a-zA-Z0-9]+\/events$/, cors: true })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private server: Server
  private logger: Logger = new Logger(EventsGateway.name)

  afterInit(namespace: Namespace) {
    this.logger.log(`WebSocket Gateway initialized at /events namespace`)
    this.server = namespace.server
  }

  async handleConnection(client: Socket) {
    const resourceName = this.getResourceNameFromNamespace(client.nsp.name)
    this.logger.log(`Client ${client.id} ${client.nsp} ${client.data} connected to ${resourceName} events`)
    this.emitEvent(resourceName, "connected", {
      message: `Connected to ${resourceName} events`,
    })
  }

  handleDisconnect(client: Socket) {
    const resourceName = this.getResourceNameFromNamespace(client.nsp.name)
    this.logger.log(`Client disconnected from ${resourceName} events`)
  }

  emitEvent(resourceName: string, event: string, data: any) {
    this.server.of(`/${resourceName}/events`).emit(event, data)
  }

  private getResourceNameFromNamespace(namespace: string): string {
    const parts = namespace.split("/")
    if (parts.length < 2)
      throw new HttpException({ error: "Invalid namespace format" }, 400)
    return parts[parts.length - 2]
  }
}
