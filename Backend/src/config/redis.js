import { Queue } from "bullmq";

export const threatQueue = new Queue("threatQueue", {
  connection: {
    host: "127.0.0.1",
    port: 6379
  }
});