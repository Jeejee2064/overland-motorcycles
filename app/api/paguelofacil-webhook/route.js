export const runtime = 'nodejs'

export async function POST(request) {
  const text = await request.text()
  console.log('📩 WEBHOOK TEST RECEIVED:', text)
  return new Response('ok')
}
