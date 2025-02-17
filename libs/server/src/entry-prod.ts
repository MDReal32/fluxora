import e from "express";

import { createApp } from "./utils/create-app";
import { renderPipeableStream } from "/@fluxora/client-server/react";

export const main = async () => {
  const app = await createApp();

  app.use("*", async (_req: e.Request, res: e.Response) => {
    const stream = renderPipeableStream({
      onAllReady() {
        stream.pipe(res);
      },
      onError(error) {
        stream.abort(error);
      }
    });
  });

  await app.listen(5000);
};

if (process.env.NODE_ENV === "production") {
  main();
}
