import type { GlobalConfig } from 'payload'

import { adminOnly, authenticated } from '@/access/roles'

export const OrgSettings: GlobalConfig = {
  slug: 'org-settings',
  label: 'Org Settings',
  access: {
    read: authenticated,
    update: adminOnly,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Employer details',
      fields: [
        { name: 'employerLegalName', type: 'text', required: true },
        { name: 'employerTradingName', type: 'text' },
        { name: 'employerAbn', type: 'text', required: true },
        { name: 'employerAddressLine1', type: 'text' },
        { name: 'employerAddressLine2', type: 'text' },
        { name: 'employerAddressSuburb', type: 'text' },
        { name: 'employerAddressState', type: 'text' },
        { name: 'employerAddressPostcode', type: 'text' },
        {
          name: 'employerBusinessAddress',
          type: 'textarea',
          admin: {
            description: 'Optional display copy of the registered address; PDF prefill uses the structured address fields above.',
          },
        },
        { name: 'payerBranchNumber', type: 'text' },
        { name: 'payrollContactName', type: 'text' },
        { name: 'payrollContactPhone', type: 'text' },
        { name: 'payrollContactEmail', type: 'email' },
        { name: 'authorizedSignatoryName', type: 'text' },
        { name: 'authorizedSignatoryTitle', type: 'text' },
        {
          name: 'payerDeclarationDatePolicy',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Auto-generate on PDF creation', value: 'auto' },
            { label: 'Leave blank for manual HR completion', value: 'manual' },
          ],
          admin: {
            description: 'Controls whether NAT3093 payer declaration dates (DecPayer-*) are prefilled.',
          },
        },
        { name: 'payrollSystemName', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Default super fund (NAT 13080 Section C)',
      fields: [
        { name: 'defaultSuperFundName', type: 'text', required: true, defaultValue: 'AustralianSuper' },
        { name: 'defaultSuperFundUsi', type: 'text', required: true, defaultValue: 'STA0100AU' },
        { name: 'defaultSuperFundAbn', type: 'text', required: true, defaultValue: '65714394898' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Workforce defaults',
      fields: [
        {
          name: 'defaultEmploymentBasis',
          type: 'select',
          required: true,
          defaultValue: 'casual',
          options: [
            { label: 'Full time', value: 'full_time' },
            { label: 'Part time', value: 'part_time' },
            { label: 'Casual', value: 'casual' },
            { label: 'Fixed term', value: 'fixed_term' },
          ],
          admin: {
            description: 'Default employment basis used when invites or join flows do not provide one.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Pinned template versions',
      fields: [
        {
          name: 'templates',
          type: 'group',
          fields: [
            { name: 'nat3092Version', type: 'text', required: true, defaultValue: 'NAT3092-06.2019' },
            { name: 'nat3093Version', type: 'text', required: true, defaultValue: 'NAT3093-placeholder' },
            { name: 'nat13080Version', type: 'text', required: true, defaultValue: 'NAT13080-2023-04' },
            { name: 'fwisVersion', type: 'text', required: true, defaultValue: 'FWIS-current' },
            { name: 'ceisVersion', type: 'text', required: true, defaultValue: 'CEIS-current' },
            { name: 'ftcisVersion', type: 'text', required: true, defaultValue: 'FTCIS-current' },
          ],
        },
      ],
    },
    {
      name: 'enableStapledSuperReview',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'When enabled, super choices are flagged for stapled-super review at approval.',
      },
    },
  ],
}
