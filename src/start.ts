import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export const startInstance = createStartHandler({
  createRouter: getRouter,
  streamHandler: defaultStreamHandler,
});
