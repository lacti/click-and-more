export default (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, millis));
