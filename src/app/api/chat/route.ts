import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const rateLimit = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 100;
const TIME_FRAME = 60 * 60 * 1000; // 1hr in milliseconds

function checkRateLimit(ip: string) {
  const currentTime = Date.now();
  const data = rateLimit.get(ip) || { count: 0, timestamp: currentTime };

  if (currentTime - data.timestamp > TIME_FRAME) {
    rateLimit.set(ip, { count: 1, timestamp: currentTime });
    return false;
  }

  if (data.count >= MAX_REQUESTS) return true;

  rateLimit.set(ip, { count: data.count + 1, timestamp: data.timestamp });
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'localhost';
  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  try {
    const {
      model = 'gpt-4o-mini',
      messages,
      response_format,
      temperature = 1.0,
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error:
            'Messages is a required parameter and must be a non-empty array',
        },
        { status: 400 }
      );
    }

    const params: any = {
      model,
      messages,
      temperature,
    };
    if (response_format) params.response_format = response_format;

    const completion = await openai.chat.completions.create(params);
    const reply = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error: any) {
    console.error('Error calling ChatGPT API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response from ChatGPT' },
      { status: 500 }
    );
  }
}
