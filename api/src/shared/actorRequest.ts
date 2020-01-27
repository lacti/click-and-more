export interface IGameMember {
  memberId: string;
  name: string;
  email: string;
}

export interface IGameActorStartEvent {
  gameId: string;
  members: IGameMember[];
  callbackUrl?: string;
}

const keyPrefixOfEvent = `click-and-more/actor-event/`;

export async function saveActorStartEvent({
  event,
  set
}: {
  event: IGameActorStartEvent;
  set: (key: string, value: string) => Promise<any>;
}): Promise<boolean> {
  if (!event.gameId) {
    return false;
  }
  await set(keyPrefixOfEvent + event.gameId, JSON.stringify(event));
  return true;
}

export async function loadActorStartEvent({
  gameId,
  get
}: {
  gameId: string;
  get: (key: string) => Promise<string | null>;
}): Promise<IGameActorStartEvent | null> {
  const value = await get(keyPrefixOfEvent + gameId);
  if (value === null) {
    return null;
  }
  try {
    const event = JSON.parse(value) as IGameActorStartEvent;
    if (!event.gameId) {
      return null;
    }
    return event;
  } catch (error) {
    // Ignore
  }
  return null;
}

export async function clearActorStartEvent({
  gameId,
  del
}: {
  gameId: string;
  del: (key: string) => Promise<any>;
}) {
  return del(keyPrefixOfEvent + gameId);
}
