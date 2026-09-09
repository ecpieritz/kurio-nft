import type { DecimalString } from '@/lib/api/contracts'

const ETH_DECIMALS = 18
const ETH_SCALE = 10n ** BigInt(ETH_DECIMALS)

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/

function assertDecimalString(value: string): asserts value is DecimalString {
  if (!decimalPattern.test(value)) {
    throw new Error(`Invalid ETH decimal value: ${value}`)
  }
}

export function ethToWei(value: DecimalString): bigint {
  assertDecimalString(value)

  const [integerPart, fractionPart = ''] = value.split('.')

  const paddedFraction = fractionPart.padEnd(ETH_DECIMALS, '0')

  return BigInt(integerPart) * ETH_SCALE + BigInt(paddedFraction || '0')
}

export function weiToEth(value: bigint): DecimalString {
  if (value < 0n) {
    throw new Error('ETH value cannot be negative.')
  }

  const integerPart = value / ETH_SCALE

  const fractionPart = value % ETH_SCALE

  if (fractionPart === 0n) {
    return String(integerPart) as DecimalString
  }

  const normalizedFraction = fractionPart.toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')

  return `${integerPart}.${normalizedFraction}` as DecimalString
}

export function addEth(...values: DecimalString[]): DecimalString {
  const total = values.reduce((accumulator, value) => accumulator + ethToWei(value), 0n)

  return weiToEth(total)
}

export function subtractEth(left: DecimalString, right: DecimalString): DecimalString {
  const result = ethToWei(left) - ethToWei(right)

  if (result < 0n) {
    throw new Error('ETH subtraction cannot produce a negative value.')
  }

  return weiToEth(result)
}

export function multiplyEth(value: DecimalString, multiplier: number): DecimalString {
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new Error('ETH multiplier must be a non-negative safe integer.')
  }

  return weiToEth(ethToWei(value) * BigInt(multiplier))
}

export function percentageOfEth(value: DecimalString, percentage: number): DecimalString {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100.')
  }

  const percentageAsString = percentage.toString()

  const [integerPart, decimalPart = ''] = percentageAsString.split('.')

  const normalizedDecimal = decimalPart.slice(0, 2).padEnd(2, '0')

  const basisPoints = BigInt(integerPart) * 100n + BigInt(normalizedDecimal)

  const result = (ethToWei(value) * basisPoints) / 10_000n

  return weiToEth(result)
}

export function sumEth(values: readonly DecimalString[]): DecimalString {
  return addEth(...values)
}
