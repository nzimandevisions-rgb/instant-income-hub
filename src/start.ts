import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export default createStartHandler({
  createRouter: getRouter,
  streamHandler: defaultStreamHandler,
})
  .handler(async (event) => {
    try {
      // This is where your app would normally render
      // If you have specific error handling, add it here
    } catch (error) {
      console.error("SSR Error:", error);
      return new Response(
        `<html><body><h1>500 Server Error</h1><p>Something went wrong. Please try again later.</p></body></html>`,
        {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }
      );
    }
  });
