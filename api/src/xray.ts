// import * as XRay from "aws-xray-sdk-core";
import logger from "./logger";

// let patched = false;

// const patchPromise = () => {
//   if (patched) {
//     return;
//   }
//   patched = true;
//   XRay.capturePromise();
// };

export const captureAsync = <Args extends any[], ReturnType>(
  name: string,
  target: (...args: Args) => Promise<ReturnType>
) => (...args: Args) => capturePromise(name, target(...args));

const pause = () => new Promise<void>(resolve => setTimeout(resolve, 10));

export const capturePromise = async <ReturnType>(
  name: string,
  target: Promise<ReturnType>
) => {
  const callback = async (segment = undefined) => {
    logger.info(name, `start-to-capture-async-func`);
    await pause();
    try {
      const result = await target;
      await pause();
      logger.info(name, `after-await-target-promise`, result);
      if (segment) {
        segment.close();
      }
      await pause();
      logger.info(name, `resolve-capture-promise`, result);
      await pause();
      return result;
    } catch (error) {
      if (segment) {
        segment.close(error);
      }
      logger.info(name, `reject-capture-promise`);
      throw error;
    }
  };
  logger.info(name, `create-capture-promise`);
  // patchPromise();
  logger.info(name, `after-patch-promise`);
  // let captured: any = XRay.captureAsyncFunc(name);
  let captured: any = callback();
  logger.info(name, `captured-result`, captured, isPromise(captured));
  while (isPromise(captured)) {
    captured = await captured;
    logger.info(name, `awaited-captured-result`, captured, isPromise(captured));
  }
  logger.info(name, `final-result`, captured, captured instanceof Promise);
  return captured;
};

const isPromise = (obj: any) =>
  !!obj &&
  (obj instanceof Promise ||
    (obj.constructor && /promise/i.test(obj.constructor.name)));
