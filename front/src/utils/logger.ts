export const logHook = (...args: any[]) => <T>(value: T) => {
  console.info(...args, value);
  return value;
};
