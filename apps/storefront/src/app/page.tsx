import { HeroSection } from '@/components/HeroSection'
import { ProductGridSection } from '@/components/ProductGridSection'
import { AiAssistantFab } from '@/components/AiAssistantFab'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-10 pb-4 md:space-y-14">
      <HeroSection />
      <ProductGridSection />
      <AiAssistantFab />
    </div>
  )
}
