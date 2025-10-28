import { createStorage, type Driver } from "unstorage";
import { createH3StorageHandler } from "unstorage/server";
import { createApp, toWebHandler } from "h3";
import { api } from "./utils";

export function createStorageApi(driver: Driver) {
  const storage = createStorage({
    driver,
  });

  const storageHandler = createH3StorageHandler(storage, {
    authorize(req) {
      console.log({ req });
    },
  });
  const app = createApp({ debug: true });
  app.use("/api/storage", storageHandler);
  const handler = toWebHandler(app);
  return api({
    "/api/storage/*": (req) => handler(req),
  });
}
