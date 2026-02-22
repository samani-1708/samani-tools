import type { NextConfig } from "next";
import path from "path";

const enableBmc = process.env.NEXT_PUBLIC_ENABLE_BMC === "true";
const bmcModulePath = enableBmc
  ? "./src/app/common/bmc.tsx"
  : "./src/app/common/bmc-disabled.tsx";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias["@/app/common/bmc"] = path.resolve(
      __dirname,
      bmcModulePath,
    );

    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
      "@/app/common/bmc": bmcModulePath,
    },
  },
};

export default nextConfig;
