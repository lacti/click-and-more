import { newApiGatewayManagementApi } from "@yingyeothon/aws-apigateway-management-api";
import env from "../../support/env";
import { FakeConnectionId } from "./fake";

export const dropConnection = (connectionId: string): Promise<any> =>
  connectionId === FakeConnectionId
    ? Promise.resolve(true)
    : newApiGatewayManagementApi({
        endpoint: env.isOffline
          ? `http://localhost:3001`
          : env.webSocketEndpoint
      })
        .deleteConnection({
          ConnectionId: connectionId
        })
        .promise();
