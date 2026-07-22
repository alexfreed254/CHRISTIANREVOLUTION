/** Stripe wordmark for payment method buttons. */
export default function StripeLogo({ className = 'h-8 w-auto' }) {
  return (
    <svg className={className} viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stripe">
      <title>Stripe</title>
      <rect width="120" height="50" rx="6" fill="#635BFF" />
      <path
        fill="#fff"
        d="M54.3 18.5c0-2.1-1.7-2.9-4.5-2.9-3.7 0-8.9 1.1-12.9 3.1V12c4.9-2.1 10.2-3.2 15.3-3.2 6.3 0 10.4 3.3 10.4 8.8v21.2h-6.5V35.6c-2.7 2.1-6.4 3.4-10.2 3.4-5.1 0-8.6-2.6-8.6-7.1 0-4.3 3.5-6.8 9.3-6.8 2.4 0 4.7.3 6.8.9v-1.5zm-6.5 10.8c-2-.7-3.7-1-5.5-1-2.2 0-3.5.9-3.5 2.4 0 1.4 1.1 2.2 3 2.2 2.1 0 4.1-.9 6-2.4v-1.2zM68.5 27.1V9h6.5v18.4c0 5.5 2.9 8 7.5 8 2.5 0 4.8-.7 6.8-2v6.2c-2.4 1.4-5.2 2.2-8.4 2.2-7.2 0-12.4-4.4-12.4-14.7z"
      />
    </svg>
  )
}
