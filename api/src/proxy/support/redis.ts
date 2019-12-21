import NaiveSocket from "@yingyeothon/naive-socket";
import Matcher, { withMatcher } from "@yingyeothon/naive-socket/lib/match";
import env from "./env";

const redisNewline = `\r\n`;
const naiveSocket = new NaiveSocket({
  host: env.redisHost,
  port: 6379
});

const encode = (commands: string[][]) =>
  commands
    .filter(Boolean)
    .map(command =>
      command
        // .map((token, index) => (index === 0 ? token : `"${token}"`))
        .join(" ")
    )
    .concat([``])
    .join(redisNewline);

export const redisSend = async (
  commands: string[][],
  fulfill: (m: Matcher) => Matcher
): Promise<string[]> => {
  const request = encode(commands);
  console.info(`Redis request`, `[${request}]`);
  const response = await naiveSocket.send({
    message: request,
    fulfill: withMatcher(fulfill),
    timeoutMillis: 5000
  });
  console.info(`Redis response`, `[${response}]`);
  return fulfill(new Matcher(response)).values();
};
