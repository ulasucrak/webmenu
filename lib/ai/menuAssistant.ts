import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL = 'gemini-2.0-flash'

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

function buildSystemPrompt(menuData: MenuProduct[], restaurantName: string, lang: 'tr' | 'en') {
  const langRule = lang === 'en'
    ? 'Respond in English.'
    : 'Türkçe konuş.'

  return `You are the digital menu assistant for ${restaurantName} restaurant.
You help customers find items from the menu.

RESTAURANT IDENTITY:
This is an Italian cuisine restaurant. When making recommendations, always prioritize Italian dishes such as pasta, pizza, risotto, lasagna. Items like burgers and wraps should only be suggested if the customer specifically asks for them.

MENU DATA:
${JSON.stringify(menuData)}

RULES:
- Only suggest items that exist in the menu
- State prices correctly
- Reply ONLY in JSON format, nothing else, no code blocks:
  { "products": [...], "message": "..." }
- Each product in the products array: { "id": "...", "name_tr": "...", "price": 0, "currency": "₺", "image_url": "..." }
- ${langRule}
- Suggest maximum 3 products`
}

export async function askMenuAssistant(
  userMessage: string,
  menuData: MenuProduct[],
  restaurantName: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<AssistantResponse> {
  const systemPrompt = buildSystemPrompt(menuData, restaurantName, lang)
  const model = genAI.getGenerativeModel({ model: MODEL })
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Anladım, menü asistanınım. Sorularınızı bekliyorum.' }] },
    ],
  })

  const result = await chat.sendMessage(userMessage)
  const text = result.response.text()
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  try {
    return JSON.parse(clean) as AssistantResponse
  } catch {
    return { products: [], message: 'Üzgünüm, yanıt işlenirken bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}
