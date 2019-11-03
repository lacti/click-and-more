import { Socket } from "net";
import env from "./env";

const redisConnect = (() => {
  let socket: Socket | undefined;
  return () =>
    new Promise<Socket>((resolve, reject) => {
      // Release previous connection.
      if (socket !== undefined) {
        console.debug(`Release an old Redis connection.`);
        socket.destroy();
      }

      // Create a new socket to connect with Redis.
      socket = new Socket();
      const handleError = (error: Error) => {
        console.error(`Redis error while connecting`, error);
        reject(error);
      };
      socket.addListener("error", handleError);
      socket.connect(6379, env.redisHost, () => {
        console.info(`Redis connected.`);
        socket.removeListener("error", handleError);
        resolve(socket);
      });
      console.debug(`Create a new Redis connection.`);
    });
})();
let redisReady = redisConnect();

const newline = `\r\n`;
let sendChain: Promise<string[]> = Promise.resolve([] as string[]);
export const redisSend = (
  messages: string[],
  responsePattern?: RegExp,
  timeoutMillis: number = 1000
) =>
  (sendChain = sendChain.then(
    () =>
      new Promise<string[]>((resolve, reject) =>
        redisReady.then(
          socket =>
            new RedisSender(
              socket,
              resolve,
              reject,
              messages,
              responsePattern,
              timeoutMillis
            )
        )
      )
  ));

// One-shot request and response exchanger.
class RedisSender {
  private timer: NodeJS.Timer | null;
  private response: string = "";

  constructor(
    private readonly socket: Socket,
    private readonly resolve: (response: string[]) => void,
    private readonly reject: (reason?: any) => void,
    messages: string[],
    private readonly responsePattern: RegExp | undefined,
    timeoutMillis: number
  ) {
    this.socket.addListener("data", this.onData);
    this.socket.addListener("error", this.onError);
    this.timer = setTimeout(this.onTimeout, timeoutMillis);

    // Send a data.
    const request = [...messages.filter(Boolean), ``].join(newline);
    console.debug(`Redis send: [${request}]`);
    this.socket.write(request);
  }

  private onError = (error: Error) => {
    console.error(`Redis error while sending a data`, error);
    this.detachAllListeners();
    this.reject(error);

    // Reset a Redis connection if there is an error.
    redisReady = redisConnect();
  };

  private onData = (data: Buffer) => {
    this.response += data.toString("utf-8");
    if (this.responsePattern === undefined) {
      return this.onResult(this.response.split(/\r\n/));
    }
    const match = this.response.match(this.responsePattern);
    if (match !== null) {
      return this.onResult(match.slice(1));
    }
  };

  private onResult = (result: string[]) => {
    console.debug(`Redis response: [${this.response}]`);
    console.debug(`Redis result: [${result}]`);
    this.detachAllListeners();
    this.resolve(result);
  };

  private onTimeout = () => {
    // It is very useful when `responsePattern` is invalid.
    this.onError(
      new Error(`Timeout with incompleted response [${this.response}]`)
    );
  };

  private detachAllListeners = () => {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.socket.removeListener("data", this.onData);
    this.socket.removeListener("error", this.onError);
  };
}
