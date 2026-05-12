import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-2.5-flash'

interface MenuProduct {
  id: string
  name_tr: string
  name_en: string | null
  price: number
  currency: string
  image_url: string | null
  tags: string[]
  description_tr: string | null
}

interface AssistantResponse {
  products: { id: string; name_tr: string; price: number; currency: string; image_url: string | null }[]
  message: string
}

function buildSystemInstruction(menuData: MenuProduct[], restaurantName: string, lang: 'tr' | 'en') {
  const langRule = lang === 'en' ? 'Respond in English.' : 'Türkçe konuş.'

  return `You are the digital menu assistant for ${restaurantName} restaurant.
You help customers find items from the menu.

RESTAURANT IDENTITY:
This is an Italian cuisine restaurant. Always prioritize Italian dishes such as pasta, pizza, risotto, lasagna. Suggest burgers or wraps only if the customer specifically asks.

MENU DATA (JSON):
${JSON.stringify(menuData)}

RULES:
- Only suggest items that exist in the menu above.
- State prices correctly.
- Reply ONLY in valid JSON — no markdown, no code blocks, no extra text:
  { "products": [...], "message": "..." }
- Each product object: { "id": "...", "name_tr": "...", "price": 0, "currency": "₺", "image_url": "..." }
- ${langRule}
- Suggest at most 3 products.`
}

export async function askMenuAssistant(
  userMessage: string,
  menuData: MenuProduct[],
  restaurantName: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<AssistantResponse> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemInstruction(menuData, restaurantName, lang),
  })

  const result = await model.generateContent(userMessage)
  const raw = result.response.text()

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  try {
    return JSON.parse(clean) as AssistantResponse
  } catch {
    console.error('[AI] JSON parse failed. Raw:', raw.substring(0, 300))
    return { products: [], message: 'Üzgünüm, yanıt işlenirken bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}
