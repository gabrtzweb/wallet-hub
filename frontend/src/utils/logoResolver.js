import { getInstitutionName } from '../config/dashboardConfig'

// Domain mapping for known financial institutions
const INSTITUTION_DOMAINS = {
  // Major Banks
  'Nubank': 'nubank.com.br',
  'Banco Inter': 'inter.co',
  'Inter': 'inter.co',
  'Itaú': 'itau.com.br',
  'Bradesco': 'bradesco.com.br',
  'Caixa': 'caixa.gov.br',
  'Santander': 'santander.com.br',
  'Banco do Brasil': 'bb.com.br',
  'BTGPactual': 'btgpactual.com',
  'C6 Bank': 'c6bank.com.br',
  'Safra': 'safra.com.br',
  'Banco Pan': 'bancopan.com.br',
  'Banco Bmg': 'bancobmg.com.br',
  'Mercado Pago': 'mercadopago.com.br',
  'PicPay': 'picpay.com',
  'PagBank': 'pagbank.com.br',
  'Neon': 'neon.com.br',
  'Next': 'next.me',
  'Banco Digio': 'digio.com.br',
  'RecargaPay': 'recargapay.com.br',
  'Stone Pagamentos': 'stone.com.br',
  
  // Investments and Brokerages
  'XP Investimentos': 'xpi.com.br',
  'Rico Investimentos': 'rico.com.vc',
  'Clear Corretora': 'clear.com.br',
  'Ágora Investimentos': 'agorainvestimentos.com.br',
  'Toro Investimentos': 'toroinvestimentos.com.br',
  
  // Cooperatives and Others
  'Sicredi': 'sicredi.com.br',
  'Sicoob': 'sicoob.com.br',
  'Unicred': 'unicred.com.br',
  'Banrisul': 'banrisul.com.br',
  
  // Benefits (food and meals)
  'Pluxee': 'pluxee.com.br',
  'Sodexo': 'sodexo.com.br',
  'Alelo': 'alelo.com.br',
  'Ticket': 'ticket.com.br',
  'VR Benefícios': 'vr.com.br',
  'Swile': 'swile.co',
  'Flash': 'flashapp.com.br',
  'Caju': 'caju.com.br',
  'iFood Benefícios': 'beneficios.ifood.com.br',
  'Eva Benefícios': 'evabeneficios.com.br',
}

const LOGO_PROVIDERS = [
  (domain) => `http://localhost:3000/api/logo-proxy?domain=${encodeURIComponent(domain)}`,
  (_, name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff&rounded=true&bold=true&size=128`,
]

const getInstitutionDomain = (account) => {
  const institutionName = getInstitutionName(account)
  if (!institutionName) return ''
  return INSTITUTION_DOMAINS[institutionName] || ''
}

/**
 * Resolves the logo URL for a given account using Apistemic Logos API.
 *
 * @param {Object} account - The account object
 * @returns {string} - The logo URL or empty string if unable to resolve
 */
export const getBankLogoUrl = (account) => {
  if (!account) return ''

  // Check if this is a manual physical wallet account
  if (account.connectionType === 'MANUAL_WALLET' || account.id === 'manual-wallets-group') {
    return '/physical-wallet.png'
  }

  const institutionName = getInstitutionName(account)
  if (!institutionName) return ''

  const domain = getInstitutionDomain(account)
  if (!domain) return ''

  return LOGO_PROVIDERS[0](domain, institutionName)
}

export const getBankLogoFallbackUrl = (account, currentUrl) => {
  if (!account) return ''
  if (account.connectionType === 'MANUAL_WALLET' || account.id === 'manual-wallets-group') return ''

  const institutionName = getInstitutionName(account)
  if (!institutionName) return ''

  const domain = getInstitutionDomain(account)
  if (!domain) return ''

  const primaryUrl = LOGO_PROVIDERS[0](domain, institutionName)
  if ((currentUrl || '').includes('/api/logo-proxy?domain=') || currentUrl === primaryUrl) {
    return LOGO_PROVIDERS[1](domain, institutionName)
  }

  return ''
}

export default getBankLogoUrl
