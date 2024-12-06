export const ensureHexPrefix = (value: string) => {
  return value.startsWith('0x') ? value : `0x${value}`
}

export const removeHexPrefix = (value: string) => {
  return value.startsWith('0x') ? value.slice(2) : value
}
