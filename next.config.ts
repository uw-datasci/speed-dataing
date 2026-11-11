import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // onnxruntime-node's install script adds a 327 MB CUDA library on Linux x64.
  // Embeddings run on CPU, so keep GPU and other-platform binaries out of the function.
  outputFileTracingExcludes: {
    "/api/admin/run-matching": [
      "node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_cuda.so",
      "node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_tensorrt.so",
      "node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**",
      "node_modules/onnxruntime-node/bin/napi-v3/darwin/**",
      "node_modules/onnxruntime-node/bin/napi-v3/win32/**",
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
