/**
 * Returns a promise that will be reolved after the specified timeout
 * @param timeout the amount of ms to wait
 */
export const delay = async (timeout: number) =>
  new Promise(resolve => setTimeout(resolve, timeout));

/**
 * Returns a promise that will ressolve when the return value of the conditionFunc is true
 * @param conditionFunc the function to execute which determines when the call succeeds. Must return a Promise
 * @param interval the number of ms between each execution of the conditionFunc
 * @param timeout the absolute timeout to abort checking the codition and return false
 */
export const waitFor = async (
  conditionFunc: () => Promise<any>,
  interval = 500,
  timeout = 5000,
): Promise<any> => {
  try {
    const result = await conditionFunc();
    // if the condition succeeds, then return immediately
    return Promise.resolve(result);
  } catch {
    // do nothing if the condition fails the first time
  }

  // return a promise that will resolve when the condition is true
  return new Promise((resolve, reject) => {
    // keep a countdown of the number of times to check
    // so it can abort after a the timeout expires
    let timesToCheck = timeout / interval;
    const timer = setInterval(async () => {
      try {
        const result = await conditionFunc();
        clearInterval(timer);
        return resolve(result);
      } catch (error) {
        // only reject when the timeout expires, otherwise ignore the error
        if (timesToCheck <= 0) {
          clearInterval(timer);
          return reject(error);
        }
      }
      // decrement the number of times to check in each iteration
      timesToCheck -= 1;
    }, interval);
  });
};
