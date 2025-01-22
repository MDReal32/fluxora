import { type ViteDevServer, createServer } from "vite";

import type { FluxoraApp, FluxoraRawConfig, MicroApp } from "@fluxora/types/core";
import {
  ErrorMessages,
  getFluxoraAppConfig,
  getFluxoraConfig,
  initialLoadExposedModules,
  saveExposedModulesToDisk
} from "@fluxora/utils";
import { getAppConfiguration } from "@fluxora/vite";

export let __VITE_DEV_SERVER_INSTANCE__: ViteDevServer;
export let __FLUXORA_APP_CONFIG__: FluxoraApp;

export const createViteServer = async (microApp: MicroApp, config: FluxoraRawConfig) => {
  if (__VITE_DEV_SERVER_INSTANCE__) return;
  const fluxoraConfig = await getFluxoraConfig(config);
  const appConfig = await getFluxoraAppConfig(microApp, fluxoraConfig);
  const viteConfig = await getAppConfiguration(appConfig);
  await initialLoadExposedModules(appConfig.app.name, appConfig.exposedModules);
  const vite = await createServer(viteConfig);
  vite.ws.listen();
  __VITE_DEV_SERVER_INSTANCE__ = vite;
  __FLUXORA_APP_CONFIG__ = appConfig;
  await saveExposedModulesToDisk(appConfig);
};

export const checkViteServer = () => {
  if (!__VITE_DEV_SERVER_INSTANCE__) {
    throw new Error(ErrorMessages.WORKER_VITE_NOT_INITIALIZED);
  }

  return __VITE_DEV_SERVER_INSTANCE__;
};

export const getAppConfig = () => {
  if (!__FLUXORA_APP_CONFIG__) {
    throw new Error(ErrorMessages.WORKER_VITE_NOT_INITIALIZED);
  }

  return __FLUXORA_APP_CONFIG__;
};
