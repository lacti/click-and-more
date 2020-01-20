export interface IUser {
  index: number;
  color: string;
}

export interface IGameUser extends IUser {
  connectionId: string;
  memberId: string;
}

export const gameUserToUser = ({ index, color }: IGameUser) => ({
  index,
  color
});

export const hasConnectionId = (users: IGameUser[], connectionId: string) =>
  users.some(u => u.connectionId === connectionId);

export const isValidUser = (userIndex: number) => userIndex > 0;
