export const WHATSAPP_NUMBER = '260971234567'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export const BUSINESS_NAME = 'ReliGood'
export const BUSINESS_TAGLINE = 'Quality Products from China to Zambia'
export const BUSINESS_DESCRIPTION =
  'We source quality products directly from Chinese manufacturers and deliver them to your doorstep in Lusaka, Zambia.'

export const CATEGORY_MAP: Record<string, string> = {
  electronics_small: 'Electronics',
  electronics_medium: 'Electronics',
  electronics_large: 'Electronics',
  beauty: 'Beauty',
  clothing: 'Clothing',
  home_textile: 'Home',
}

export const CATEGORIES = ['All', 'Electronics', 'Beauty', 'Clothing', 'Home'] as const

export const PAYMENT_METHODS = ['Airtel Money'] as const

export const DELIVERY_INFO = '~2 weeks from China to Lusaka'
export const DEPOSIT_PERCENT = 30

export const CATEGORY_SUBTITLES: Record<string, string> = {
  Electronics: '手机配件 · 数码好物',
  Beauty: '美妆护肤 · 个护清洁',
  Clothing: '男装女装 · 鞋包配饰',
  Home: '家居家纺 · 生活百货',
}

export const SEARCH_PLACEHOLDER = 'Search products...'

// --- PDP 7-surface constants ---

export const KNOWN_BRANDS = new Set([
  'philips', 'xiaomi', 'samsung', 'apple', 'huawei', 'oppo', 'vivo', 'realme',
  'anker', 'baseus', 'ugreen', 'jbl', 'sony', 'lenovo', 'redmi', 'nokia',
  'logitech', 'hisense', 'midea', 'haier', 'deli', 'maybelline', "l'oreal",
  'nivea', 'dove', 'olay', 'nike', 'adidas', 'puma', 'new balance',
])

export const CATEGORY_FEATURES: Record<string, string> = {
  electronics: '220V compatible for Zambian power',
  beauty: 'Dermatologically tested & sealed packaging',
  clothing: 'Size guide available — message us on WhatsApp',
  home: 'Durable materials suited for everyday use',
  home_textile: 'Durable materials suited for everyday use',
}

export const CATEGORY_STORIES: Record<string, { heading: string; body: string }[]> = {
  electronics: [
    { heading: 'Built for Your Daily Life', body: 'From early morning alarms to late-night video calls, these electronics are designed to keep up with your routine — reliable, efficient, and ready when you are.' },
    { heading: 'Quality You Can Trust', body: 'Every product goes through manufacturer quality checks before shipping. We only source from verified factories with proven track records.' },
  ],
  beauty: [
    { heading: 'Your Glow-Up Starts Here', body: 'Whether it\'s a fresh skincare routine or a bold new look, our beauty products bring international quality to your doorstep in Lusaka.' },
    { heading: 'Safe & Sealed', body: 'All beauty items ship factory-sealed with original packaging. We never resell opened or expired products.' },
  ],
  clothing: [
    { heading: 'Style That Travels Well', body: 'Trending designs sourced straight from top manufacturers. Stand out in Lusaka with styles that are making waves worldwide.' },
    { heading: 'Fit & Fabric First', body: 'We prioritize comfortable fabrics and accurate sizing. Not sure about your size? Message us and we\'ll help you pick the perfect fit.' },
  ],
  home: [
    { heading: 'Upgrade Your Space', body: 'Small changes make a big difference. Our home products are picked to bring comfort, function, and a touch of style to every room.' },
    { heading: 'Made to Last', body: 'We focus on durable materials and practical designs that hold up to everyday use in Zambian households.' },
  ],
  home_textile: [
    { heading: 'Comfort You Can Feel', body: 'Soft fabrics, vibrant prints, and quality stitching — our textiles are chosen to transform your bedroom and living spaces.' },
    { heading: 'Made to Last', body: 'We focus on durable materials and practical designs that hold up to everyday use in Zambian households.' },
  ],
}

export const CATEGORY_FAQS: Record<string, { q: string; a: string }[]> = {
  electronics: [
    { q: 'Will this work with Zambian power outlets?', a: 'Yes — all electronics we sell are compatible with 220V Zambian power. Some items include a plug adapter.' },
    { q: 'Is there a warranty?', a: 'Most electronics come with a manufacturer warranty. We also offer a 7-day satisfaction check after delivery.' },
  ],
  beauty: [
    { q: 'Are these products authentic?', a: 'Absolutely. We source directly from authorized distributors and verified factories. All items arrive factory-sealed.' },
    { q: 'What if I have sensitive skin?', a: 'Check the ingredient list on the product page or ask us on WhatsApp — we\'re happy to help you choose the right product.' },
  ],
  clothing: [
    { q: 'How do I know my size?', a: 'Message us on WhatsApp with your measurements and we\'ll recommend the best size. Most items follow Asian sizing which runs smaller.' },
    { q: 'Can I return if it doesn\'t fit?', a: 'We offer exchanges within 3 days of delivery for unworn items with original tags.' },
  ],
  home: [
    { q: 'Is assembly required?', a: 'Some larger items require simple assembly. We include instructions and you can always WhatsApp us for help.' },
    { q: 'What if the item arrives damaged?', a: 'Send us photos on WhatsApp within 24 hours and we\'ll arrange a replacement or refund.' },
  ],
  home_textile: [
    { q: 'Are these machine washable?', a: 'Most of our textiles are machine washable. Check the care label or ask us on WhatsApp for specific care instructions.' },
    { q: 'What if the item arrives damaged?', a: 'Send us photos on WhatsApp within 24 hours and we\'ll arrange a replacement or refund.' },
  ],
}

export const UNIVERSAL_FAQS: { q: string; a: string }[] = [
  { q: 'How long does delivery take?', a: 'Approximately 2 weeks from order confirmation to delivery in Lusaka.' },
  { q: 'What payment methods do you accept?', a: 'We accept Airtel Money and MTN Mobile Money. Pay a 30% deposit to confirm, balance on delivery.' },
  { q: 'Are all products authentic?', a: 'Yes. We source directly from verified manufacturers and authorized distributors in China.' },
  { q: 'What is your return policy?', a: 'We offer exchanges or refunds within 3 days of delivery for items in original condition. Contact us on WhatsApp with photos.' },
]

export const CATEGORY_WEIGHTS: Record<string, string> = {
  electronics_small: '0.2–0.5 kg',
  electronics_medium: '0.5–2 kg',
  electronics_large: '2–5 kg',
  beauty: '0.1–0.5 kg',
  clothing: '0.2–0.8 kg',
  home_textile: '0.5–2 kg',
  home: '0.5–3 kg',
}
