
let runtimeGeminiKey: string | null = null;

export const setRuntimeGeminiKey = (key: string) => {
  if (key && key.startsWith('AIza')) {
    runtimeGeminiKey = key;
    return true;
  }
  return false;
};

export const getRuntimeGeminiKey = () => {
  return runtimeGeminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
};
