import Image from 'next/image'
import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  label?: string
  className?: string
  imageClassName?: string
  priority?: boolean
}

const LOGO_SRC = '/images/bang-me-logo.png'

export function BrandLogo({
  href,
  label = 'BangMe',
  className = '',
  imageClassName = 'h-7 w-auto max-w-[130px]',
  priority = false,
}: BrandLogoProps) {
  const logo = (
    <Image
      src={LOGO_SRC}
      alt={`${label} logo`}
      width={220}
      height={80}
      className={`object-contain ${imageClassName}`}
      priority={priority}
    />
  )

  if (href) {
    return (
      <Link href={href} aria-label={label} className={`inline-flex items-center shrink-0 ${className}`}>
        {logo}
      </Link>
    )
  }

  return <div className={`inline-flex items-center shrink-0 ${className}`}>{logo}</div>
}