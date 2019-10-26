import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { requestToActor } from "./actor";
import logger from "./logger";
import { ActionRequest } from "./message";

const gameId = "7ff2b2ec-3823-48cb-9431-098344310b23";

export const connect: APIGatewayProxyHandler = async event => {
  await requestToActor(gameId, {
    type: "enter",
    connectionId: event.requestContext.connectionId
  });
  return {
    statusCode: 200,
    body: "OK"
  };
};

export const disconnect: APIGatewayProxyHandler = async event => {
  await requestToActor(gameId, {
    type: "leave",
    connectionId: event.requestContext.connectionId
  });
  return {
    statusCode: 200,
    body: "OK"
  };
};

export const message: APIGatewayProxyHandler = async event => {
  const request = parseRequest(event.body);
  if (!!request) {
    await requestToActor(gameId, {
      ...request,
      connectionId: event.requestContext.connectionId
    });
  }
  return {
    statusCode: 200,
    body: "OK"
  };
};

const parseRequest = (input: string) => {
  const body = (input || "").trim();
  if (!body) {
    return null;
  }
  try {
    return JSON.parse(body) as ActionRequest;
  } catch (error) {
    logger.debug(`Invalid message`, input);
    return null;
  }
};
