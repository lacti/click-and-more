import { newApiGatewayManagementApi } from "@yingyeothon/aws-apigateway-management-api";
import env from "../support/env";

export const dropConnection = (connectionId: string) =>
  newApiGatewayManagementApi({
    endpoint: env.webSocketEndpoint
  })
    .deleteConnection({
      ConnectionId: connectionId
    })
    .promise();
