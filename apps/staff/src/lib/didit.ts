import { toDiditMobilePhone } from '@/lib/phone'

export interface StaffContractDiditConfig {
  draftId: string | number
  contractId: string | number
  userId: string | number
  firstName: string
  lastName: string
  email: string
  mobile: string
  address: string
  state?: string
  postcode: string
  roleTitle?: string
  redirectUrl: string
}

interface DiditSessionResponse {
  session_id: string
  url?: string
  verification_url?: string
}

export interface DiditDecision {
  status: string
  selfieImageUrl: string | null
  livenessScore: number | null
  faceQuality: number | null
  smsVerification: {
    phoneNumber: string
    carrier: string
    carrierType: string
    country: string
    verifiedAt: string
    isDisposable: boolean
    isVirtual: boolean
  } | null
  ipAnalysis: {
    ipAddress: string
    city: string
    state: string
    country: string
    isp: string
    platform: string
    browser: string
    os: string
    isVpn: boolean
    deviceFingerprint: string
  } | null
  features: string[]
  verifiedName: string | null
  verifiedAt: string | null
  sessionId: string
  sessionNumber: number | null
}

export function isDiditConfigured(): boolean {
  return Boolean(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID)
}

export class DiditClient {
  private apiKey: string
  private apiUrl: string
  private workflowId: string

  constructor() {
    this.apiKey = process.env.DIDIT_API_KEY || ''
    this.apiUrl = process.env.DIDIT_API_URL || 'https://verification.didit.me'
    this.workflowId = process.env.DIDIT_WORKFLOW_ID || ''
  }

  async createStaffContractSession(config: StaffContractDiditConfig): Promise<{ url: string; sessionId: string }> {
    if (!this.apiKey) throw new Error('DIDIT_API_KEY is not configured')
    if (!this.workflowId) throw new Error('DIDIT_WORKFLOW_ID is not configured')

    const diditPhone = toDiditMobilePhone(config.mobile)
    if (!diditPhone) {
      throw new Error('A valid Australian mobile number is required for identity verification.')
    }

    const dateSubmitted = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const vendorData = [
      `Contract ID: ${config.contractId}`,
      `Draft ID: ${config.draftId}`,
      `First Name: ${config.firstName}`,
      `Last Name: ${config.lastName}`,
      `email: ${config.email}`,
      `Role: ${config.roleTitle || 'N/A'}`,
      `Date submitted: ${dateSubmitted}`,
    ].join(', ')

    const metadata = JSON.stringify({
      draftId: config.draftId,
      contractId: config.contractId,
      userId: config.userId,
      roleTitle: config.roleTitle || null,
      address: `${config.address}, ${config.state || ''} ${config.postcode}`.trim(),
      dateSubmitted,
      source: 'flaus-staff-hub-contracts',
    })

    const body = {
      workflow_id: this.workflowId,
      vendor_data: vendorData,
      callback: config.redirectUrl,
      callback_method: 'both',
      metadata,
      language: 'en',
      contact_details: {
        email: config.email,
        send_notification_emails: false,
        email_lang: 'en',
        phone: diditPhone,
      },
      expected_details: {
        first_name: config.firstName,
        last_name: config.lastName,
        address: `${config.address}, ${config.postcode}`,
        id_country: 'AUS',
        poa_country: 'AUS',
      },
    }

    const response = await fetch(`${this.apiUrl}/v3/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`Didit session error: ${response.status} — ${errBody}`)
    }

    const data: DiditSessionResponse = await response.json()
    const sessionUrl = data.url || data.verification_url
    if (!sessionUrl) throw new Error('Didit did not return a verification URL')

    return { url: sessionUrl, sessionId: data.session_id }
  }
}

export const diditClient = new DiditClient()

export async function getDiditSessionDecision(sessionId: string): Promise<DiditDecision> {
  const apiKey = process.env.DIDIT_API_KEY || ''
  const apiUrl = process.env.DIDIT_API_URL || 'https://verification.didit.me'

  const response = await fetch(`${apiUrl}/v3/session/${sessionId}/decision/`, {
    method: 'GET',
    headers: { 'X-API-Key': apiKey },
  })

  if (!response.ok) {
    throw new Error(`Didit decision error: ${response.status}`)
  }

  const data = await response.json()

  let selfieImageUrl: string | null = null
  let livenessScore: number | null = null
  let faceQuality: number | null = null

  if (Array.isArray(data.liveness_checks) && data.liveness_checks.length > 0) {
    const lc = data.liveness_checks[0]
    selfieImageUrl = lc.reference_image || null
    livenessScore = lc.score ?? null
    faceQuality = lc.face_quality ?? null
  }

  let smsVerification: DiditDecision['smsVerification'] = null
  if (Array.isArray(data.phone_verifications) && data.phone_verifications.length > 0) {
    const pv = data.phone_verifications[0]
    smsVerification = {
      phoneNumber: pv.full_number || `${pv.phone_number_prefix}${pv.phone_number}`,
      carrier: pv.carrier?.name || 'Unknown',
      carrierType: pv.carrier?.type || 'Unknown',
      country: pv.country_name || pv.country_code || 'Unknown',
      verifiedAt: pv.verified_at || '',
      isDisposable: pv.is_disposable || false,
      isVirtual: pv.is_virtual || false,
    }
  }

  let ipAnalysis: DiditDecision['ipAnalysis'] = null
  if (Array.isArray(data.ip_analyses) && data.ip_analyses.length > 0) {
    const desktop = data.ip_analyses.find((ip: { platform?: string }) => ip.platform === 'desktop')
    const ip = desktop || data.ip_analyses[0]
    ipAnalysis = {
      ipAddress: ip.ip_address || '',
      city: ip.ip_city || '',
      state: ip.ip_state || '',
      country: ip.ip_country || '',
      isp: ip.isp || '',
      platform: ip.platform || '',
      browser: ip.browser_family || '',
      os: ip.os_family || '',
      isVpn: ip.is_vpn_or_tor || false,
      deviceFingerprint: ip.device_fingerprint || '',
    }
  }

  const verifiedName =
    [data.expected_details?.first_name, data.expected_details?.last_name].filter(Boolean).join(' ') || null

  return {
    status: data.status || 'Unknown',
    selfieImageUrl,
    livenessScore,
    faceQuality,
    smsVerification,
    ipAnalysis,
    features: data.features || [],
    verifiedName,
    verifiedAt: data.created_at || null,
    sessionId,
    sessionNumber: data.session_number ?? null,
  }
}

export function normaliseDiditStatus(
  rawStatus: string,
): { status: 'Approved' | 'Declined' | 'Pending' | 'Expired'; reason?: string } {
  const normalised = rawStatus.toLowerCase()

  if (normalised === 'approved' || normalised === 'verified') {
    return { status: 'Approved' }
  }
  if (normalised === 'declined' || normalised === 'rejected' || normalised === 'failed') {
    return {
      status: 'Declined',
      reason:
        'Identity verification was not successful. This can happen if the selfie was unclear or the liveness check could not be completed.',
    }
  }
  if (normalised === 'expired' || normalised === 'abandoned' || normalised === 'kyc expired') {
    return {
      status: 'Expired',
      reason: 'Your verification session ended before it was completed. Please try again.',
    }
  }

  return { status: 'Pending' }
}

export async function downloadImageAsBase64(url: string): Promise<string | null> {
  const apiKey = process.env.DIDIT_API_KEY || ''

  try {
    let response = await fetch(url, { headers: { 'X-API-Key': apiKey } })
    if (!response.ok && response.status === 403) {
      response = await fetch(url)
    }
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}
