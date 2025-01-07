/* eslint-disable @typescript-eslint/no-explicit-any */
const replacer = (_key: string, value: any): any => (typeof value === 'bigint' ? { $bigint: value.toString() } : value)

const reviver = (_key: string, value: any): any => (value && value.$bigint ? BigInt(value.$bigint) : value)

export const toString = (obj: any): string => JSON.stringify(obj, replacer)

export const toObject = (str: string): any => JSON.parse(str, reviver)
