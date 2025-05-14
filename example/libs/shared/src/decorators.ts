import { createParamDecorator, ExecutionContext } from '@nestjs/common'

function convertToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertToCamelCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [snakeToCamelCase(key)]: convertToCamelCase(obj[key]),
      }),
      {}
    )
  }
  return obj
}

function snakeToCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''))
}

export const TransformedQuery = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()

  return convertToCamelCase({ ...request.query })
})

export const TransformedBody = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return convertToCamelCase({ ...request.body })
})
