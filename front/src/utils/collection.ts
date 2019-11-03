type AnyMap = { [key: number]: any } | { [key: string]: any };

export const deleteKeyFromMap = <M extends AnyMap>(map: M, key: keyof M) => {
  const newMap = { ...map };
  delete newMap[key];
  return newMap;
};
