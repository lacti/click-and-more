export interface IUser {
  index: number;
  color: string;
}

export interface IGameUser extends IUser {
  connectionId: string;
  memberId: string;
  load: boolean;

  energy: number;
}

export const gameUserToUser = ({ index, color }: IGameUser) => ({
  index,
  color
});

export const isValidUser = (userIndex: number) => userIndex > 0;
