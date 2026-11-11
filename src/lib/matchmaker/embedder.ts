// Local sentence-transformers embeddings via transformers.js — no API key, no per-call cost.
import { pipeline } from "@huggingface/transformers";

export const EMBEDDING_DIM = 384;

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

// Cache dir must be writable; Vercel's filesystem is read-only except /tmp.
const CACHE_DIR = process.env.TRANSFORMERS_CACHE || "/tmp/transformers-cache";

// Narrow, hand-written shape to sidestep TS2590 from the library's huge pipeline() overload set.
type Extractor = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<Extractor> | null = null;

// Loaded once per warm serverless instance instead of on every call.
function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_NAME, {
      cache_dir: CACHE_DIR,
    }) as unknown as Promise<Extractor>;
  }
  return extractorPromise;
}

/**
 * Generates a 384-dim sentence embedding for the given text using all-MiniLM-L6-v2.
 */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
