import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { NextFunction, Request, Response } from 'express'

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private readonly whitelistedIps: string[] = []
  private readonly enabled: boolean
  private readonly logger = new Logger(IpWhitelistMiddleware.name)

  constructor(private configService: ConfigService) {
    const whitelistString = this.configService.get<string>('IP_WHITELIST', '')
    this.whitelistedIps = whitelistString
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)

    this.enabled = this.configService.get<string>('ENABLE_IP_WHITELIST', 'false').toLowerCase() === 'true'
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.enabled) {
      return next()
    }

    const clientIp = this.getClientIp(req)

    if (this.whitelistedIps.includes(clientIp)) {
      return next()
    }

    this.logger.warn(`Access denied for IP: ${clientIp}`)
    return res.status(403).json({
      statusCode: 403,
      message: 'Forbidden: IP address not whitelisted',
      error: 'Forbidden',
    })
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'] as string
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim()
    }
    return req.socket.remoteAddress || '0.0.0.0'
  }
}
