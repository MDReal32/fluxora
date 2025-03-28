import { type Plugin, type ResolvedConfig, type UserConfig, defineConfig } from "vite";

import { appManager } from "@fluxora/common";
import type { App } from "@fluxora/types/core";
import {
  CLIENT_ENTRY_FILE_EXTENSIONS,
  PACKAGE_ENTRIES,
  PACKAGE_ENTRY_NAMES,
  PACKAGE_ENTRY_ORIGINAL_MAPPING,
  PACKAGE_ORIGINALS,
  SERVER_ENTRY_FILE_EXTENSIONS,
  VIRTUAL_ALIAS_ENTRIES
} from "@fluxora/utils";

import { findEntryFile } from "../../../utils/find-entry-file";

export const fluxoraEntryPlugin = (app: App): Plugin => {
  const libs = appManager.getLibs();
  const libNamePathMapping = new Set(libs.map(lib => lib.packageJson.name));

  return {
    name: "fluxora:core-plugins:entry-client",

    config() {
      const appEntry = findEntryFile(app.root, "entry-client", CLIENT_ENTRY_FILE_EXTENSIONS);
      const template = appManager.getTemplateApp();

      const templatePath = template
        ? findEntryFile(template.root, "main", CLIENT_ENTRY_FILE_EXTENSIONS)
        : PACKAGE_ORIGINALS.REACT_CLIENT_NOOP;

      return defineConfig({
        resolve: {
          alias: {
            // Common Aliases
            [VIRTUAL_ALIAS_ENTRIES.APP]: appEntry,
            [VIRTUAL_ALIAS_ENTRIES.TEMPLATE]: templatePath
          }
        }
      });
    },

    resolveId(id, importer) {
      if (libNamePathMapping.has(id)) {
        return { id, external: true };
      }

      if (PACKAGE_ENTRY_NAMES.has(id)) {
        const entry = PACKAGE_ENTRY_ORIGINAL_MAPPING[id as keyof typeof PACKAGE_ENTRY_ORIGINAL_MAPPING];
        return this.resolve(entry);
      }

      if (importer && PACKAGE_ENTRY_NAMES.has(importer)) {
        return this.resolve(id, importer, { skipSelf: true });
      }

      // Server Handling
      if (id === VIRTUAL_ALIAS_ENTRIES.APP_MODULE) {
        return findEntryFile(app.root, "entry-server", SERVER_ENTRY_FILE_EXTENSIONS);
      }

      if (importer === VIRTUAL_ALIAS_ENTRIES.APP_MODULE) {
        const importer = findEntryFile(app.root, "entry-server", SERVER_ENTRY_FILE_EXTENSIONS);
        return this.resolve(id, importer, { skipSelf: true });
      }

      if (id === VIRTUAL_ALIAS_ENTRIES.SSR_ENTRY) {
        return id;
      }
    },

    load(id) {
      if (id === VIRTUAL_ALIAS_ENTRIES.SSR_ENTRY) {
        return `export { EntryApp } from "${PACKAGE_ENTRIES.REACT_CLIENT_SERVER_ENTRY}";`;
      }
    }
  };
};
