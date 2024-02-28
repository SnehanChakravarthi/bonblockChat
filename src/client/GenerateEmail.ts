import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function GenerateEmail({ data }: { data: any }) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. You are helping me write an email.',
      },
      { role: 'user', content: data },
    ],
    model: 'gpt-3.5-turbo',
  });

  console.log(completion.choices[0]);

  return completion.choices[0].message.content;
}

export default GenerateEmail;
