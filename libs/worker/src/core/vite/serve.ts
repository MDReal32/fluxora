import express from "express";
import { isRunnableDevEnvironment } from "vite";

import type { WorkerMessage } from "@fluxora/types/worker";
import { ErrorMessages, PACKAGE_ENTRIES, VITE_ENVIRONMENTS } from "@fluxora/utils";
import type { INestApplication } from "@nestjs/common";

import { logger } from "../../utils/logger";
import { checkViteServer, getAppConfig } from "./create-vite-server";

export let __APP__: express.Application;

export const serve = () =>
  new Promise<WorkerMessage>(async resolve => {
    const vite = checkViteServer();
    const appConfig = getAppConfig();

    const clientEnv = vite.environments[VITE_ENVIRONMENTS.CLIENT];
    const serverEnv = vite.environments[VITE_ENVIRONMENTS.SERVER];

    let module: { main: () => Promise<INestApplication> };
    if (isRunnableDevEnvironment(serverEnv)) {
      module = await serverEnv.runner.import(PACKAGE_ENTRIES.FLUXORA_SERVER_ENTRY);
    } else {
      throw new Error("Server environment is not runnable");
    }

    const nestApp = await module.main();
    const nestMiddleware = nestApp.getHttpAdapter().getInstance();

    __APP__ = express()
      .use(vite.middlewares)
      .all(`/api/v1/${appConfig.app.name}*`, (req, res) => {
        nestMiddleware(req, res);
      })
      .get(appConfig.remoteEntry.entryPath, async (req, res) => {
        const js = await clientEnv.transformRequest(req.url);
        res.status(200).setHeader("Content-Type", "application/javascript").end(js);
      })
      .use("*", async (req, res) => {
        const html = await vite.transformIndexHtml(req.url, "");
        res.status(200).end(html);
      });

    __APP__.listen(vite.config.server!.port, () => {
      logger.debug(`App (${appConfig.app.name}) is running at http://localhost:${vite.config.server?.port}`);
      resolve({ port: vite.config.server!.port! });
    });
  });

export const checkApp = () => {
  if (!__APP__) {
    throw new Error(ErrorMessages.WORKER_APP_NOT_INITIALIZED);
  }

  return __APP__;
};
