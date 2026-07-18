/**
 * Brand logo — keeps the tall cross+shield mark correctly proportioned.
 * size: "nav" | "sm" | "md" | "lg" | "hero"
 */
const SIZE = {
  nav: 'h-14 sm:h-16 w-auto',
  sm: 'h-12 w-auto',
  md: 'h-24 w-auto',
  lg: 'h-32 sm:h-36 w-auto',
  hero: 'h-52 sm:h-64 md:h-72 w-auto max-w-[min(100%,22rem)]',
}

export default function BrandLogo({ size = 'md', className = '', priority = false }) {
  return (
    <img
      src="/logo.png"
      alt="Christ Revolution Movement"
      width={712}
      height={933}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      className={`${SIZE[size] || SIZE.md} object-contain object-center select-none ${className}`}
      draggable={false}
    />
  )
}
