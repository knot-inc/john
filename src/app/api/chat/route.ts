import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
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
