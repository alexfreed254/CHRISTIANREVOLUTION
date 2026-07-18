/** Official M-Pesa logo for payment method buttons. */
export default function MpesaLogo({ className = 'h-8 w-auto' }) {
  return (
    <img
      src="/mpesa-logo.png"
      alt="M-Pesa"
      className={`object-contain ${className}`}
      draggable={false}
      decoding="async"
    />
  )
}
