import { isDiditConfigured } from '@/lib/didit'

export { isDiditConfigured }

/** Whether the contract signing UI should include the Didit verification step. */
export function contractRequiresDidit(contract: { requireDiditVerification?: boolean | null }): boolean {
  return contract.requireDiditVerification !== false
}

/** Whether signing is blocked until Didit approval (API keys present + contract requires it). */
export function isDiditEnforced(contract: { requireDiditVerification?: boolean | null }): boolean {
  return contractRequiresDidit(contract) && isDiditConfigured()
}
