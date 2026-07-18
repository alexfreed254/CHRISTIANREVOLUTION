/** M-Pesa wordmark-style mark for payment method buttons. */
export default function MpesaLogo({ className = 'h-8 w-auto' }) {
  return (
    <svg className={className} viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="M-Pesa">
      <title>M-Pesa</title>
      <rect x="0" y="4" width="32" height="32" rx="6" fill="#4CAF50" />
      <text x="16" y="26" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="16">M</text>
      <text x="42" y="28" fill="#4CAF50" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="22" letterSpacing="0.5">
        M-PESA
      </text>
    </svg>
  )
}
