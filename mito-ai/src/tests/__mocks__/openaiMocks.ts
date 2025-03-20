import OpenAI from 'openai';

/**
 * Creates a mock OpenAI chat message with the specified role and content
 */
export const createMockMessage = (role: 'user' | 'assistant' | 'system', content: string): OpenAI.Chat.ChatCompletionMessageParam => ({
    role,
    content
}); 