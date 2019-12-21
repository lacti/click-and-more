import { newApiGatewayManagementApi } from "@yingyeothon/aws-apigateway-management-api";
import env from "../support/env";

export const dropConnection = (connectionId: string) =>
  newApiGatewayManagementApi({
    endpoint: env.isOffline ? `http://localhost:3001` : env.webSocketEndpoint
  })
    .deleteConnection({
      ConnectionId: connectionId
    })
    .promise();
