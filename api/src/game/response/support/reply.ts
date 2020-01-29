import { ApiGatewayManagementApi } from "aws-sdk";
import mem from "mem";
import logger from "../../logger";
import env from "../../support/env";

const apimgmt = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
});

export const reply = mem(
  (connectionId: string) => <T extends { type: string }>(
    response: T
  ): Promise<boolean> =>
    apimgmt
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(response)
      })
      .promise()
      .then(() => true)
      .catch(error => {
        logger.error(`Cannot reply to`, connectionId, response, error);
        return false;
      })
);
