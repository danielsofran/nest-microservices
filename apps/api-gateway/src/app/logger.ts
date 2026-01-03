import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common"
import { Observable } from "rxjs"
import { tap } from "rxjs/operators"
import { Logger } from "@nestjs/common"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const currentProtocol = context.getType()
    if (!currentProtocol.startsWith("http")) {
      // Skip logging for non-HTTP requests
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const { method, url, query, body, headers } = request

    // Log the incoming request (with colors)
    this.logger.log(
      `Incoming Request: \x1b[33m${method} ${url}\x1b[0m\n` + // Yellow
        `Query: \x1b[36m${JSON.stringify(query, null, 2)}\x1b[0m\n` + // Cyan
        `Headers: \x1b[35m${JSON.stringify(headers)}\x1b[0m\n` + // Magenta
        `Body: \x1b[32m\n${JSON.stringify(body, null, 2)}\x1b[0m` // Green
    )

    const now = Date.now()
    return next.handle().pipe(
      tap(responseBody => {
        const response = context.switchToHttp().getResponse()
        const { statusCode } = response

        // Log the outgoing response (with colors)
        this.logger.log(
          `Outgoing Response: \x1b[33m${method} ${url}\x1b[0m \x1b[34m(${statusCode})\x1b[0m\n` + // Yellow + Blue
            `Time taken: \x1b[36m${Date.now() - now}ms\x1b[0m\n` + // Cyan
            `Response Body: \x1b[32m\n${JSON.stringify(responseBody, null, 2)}\x1b[0m` // Green
        )
      })
    )
  }
}
