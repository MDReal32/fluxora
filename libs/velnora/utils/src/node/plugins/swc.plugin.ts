import merge from "lodash.merge";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import MagicString from "magic-string";
import { Plugin } from "vite";

import { transform } from "@swc/core";

const swcConfigDefaults = {
  jsc: {
    target: "esnext",
    parser: {
      syntax: "typescript",
      decorators: true
    },
    transform: {
      legacyDecorator: true,
      decoratorMetadata: true,
      useDefineForClassFields: false
    },
    externalHelpers: true
  },
  module: {
    type: "es6"
  }
};

export function swcPlugin(): Plugin {
  let swcConfig: any = swcConfigDefaults;

  return {
    name: "vite:swc-transform",
    enforce: "pre",

    async configResolved() {
      const configFile = resolve(process.cwd(), ".swcrc");

      if (existsSync(configFile)) {
        const loaded = JSON.parse(readFileSync(configFile, "utf-8"));
        const internalConfig = loaded.default ?? loaded;
        swcConfig = merge(swcConfigDefaults, internalConfig);
      }
    },

    async transform(code, id) {
      if (!/\.(ts|js|tsx|jsx)$/.test(id) || id.includes("node_modules")) return;

      const result = await transform(code, { filename: id, ...swcConfig });
      const ms = new MagicString(result.code);
      return { code: ms.toString(), map: ms.generateMap({ source: id, hires: true }) };
    }
  };
}
