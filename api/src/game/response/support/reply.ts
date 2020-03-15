import { ApiGatewayManagementApi } from "aws-sdk";
import mem from "mem";
import { getLogger } from "../../logger";
import env from "../../support/env";

export const FakeConnectionId = `__FAKE_CONNECTION_ID__`;

const apimgmt = new ApiGatewayManagementApi({
  endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
});

export const reply = mem(
  (connectionId: string) => <T extends { type: string }>(
    response: T
  ): Promise<boolean> =>
    connectionId === FakeConnectionId
      ? Promise.resolve(true)
      : apimgmt
          .postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(response)
          })
          .promise()
          .then(() => {
            getLogger().debug(`Reply`, connectionId, response);
            return true;
          })
          .catch(error => {
            getLogger().error(`Cannot reply to`, connectionId, response, error);
            return false;
          })
);
