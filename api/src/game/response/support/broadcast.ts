import { reply } from "./reply";

export interface IRespondResult {
  [connectionId: string]: boolean;
}

export const broadcast = <T extends { type: string }>(
  connectionIds: string[],
  response: T
): Promise<IRespondResult> =>
  Promise.all(
    connectionIds.map(connectionId =>
      reply(connectionId)(response).then(
        success =>
          ({
            [connectionId]: success
          } as IRespondResult)
      )
    )
  ).then(result =>
    result.reduce((acc, cur) => Object.assign(acc, cur), {} as IRespondResult)
  );
