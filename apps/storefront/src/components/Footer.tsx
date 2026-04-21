import Link from 'next/link'
import { BUSINESS_NAME, BUSINESS_DESCRIPTION, WHATSAPP_URL, WHATSAPP_NUMBER } from '@/lib/constants'

function formatPhoneNumber(num: string) {
  // "260971234567" → "+260 971 234 567"
  return `+${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 9)} ${num.slice(9)}`
}

export function Footer() {
  const formattedNumber = formatPhoneNumber(WHATSAPP_NUMBER)

  return (
    <footer className="bg-primary">
      <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-12 md:py-14">
        <div className="flex flex-col items-center text-center md:grid md:grid-cols-[1fr_1fr] md:items-start md:gap-12 md:text-left">
          {/* Brand */}
          <div>
            <h3 className="font-display text-lg font-extrabold italic">
              <span className="text-white">Reli</span><span className="text-accent">Good</span>
            </h3>
            <p className="mt-3 text-sm text-white/50 leading-relaxed">
              {BUSINESS_DESCRIPTION}
            </p>
            <p className="mt-4 text-xs text-white/40">We accept Airtel Money</p>
          </div>

          {/* Connect */}
          <div className="mt-8 md:mt-0">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">Connect</h4>

            {/* Mobile: WhatsApp pill button */}
            <div className="mt-3 md:hidden">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {formattedNumber}
              </a>
            </div>

            {/* Desktop: WhatsApp number + subtitle */}
            <div className="mt-3 hidden md:block">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white hover:text-white/80 transition-colors"
              >
                {formattedNumber}
              </a>
              <p className="mt-0.5 text-xs text-white/40">WhatsApp only</p>
            </div>

            <div className="mt-3">
              <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/10 pt-6 md:flex-row md:justify-between">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </p>
          <Link href="/about" className="text-xs text-white/40 hover:text-white/60 transition-colors md:hidden">
            About Us
          </Link>
        </div>
      </div>
    </footer>
  )
}
