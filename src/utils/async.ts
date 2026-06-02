/**
 * Returns a promise that will be resolved after the specified timeout
 * @param timeout the amount of ms to wait
 */
export const delay = (timeout: number) => {
  if (process.env.NODE_ENV === 'test') timeout = 10;
  return new Promise(resolve => setTimeout(resolve, timeout));
};

/**
 * Returns a promise that will resolve when execution of the conditionFunc does not throw an error
 * @param conditionFunc the function to execute which determines when the call succeeds. Must return a Promise
 * @param interval the number of ms between each execution of the conditionFunc
 * @param timeout the absolute timeout to abort checking the condition and return false
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
  } catch (error) {
    // do nothing if the condition fails the first time
    // unless when abortWaitFor is called
    if (error instanceof AbortWaitError) throw error;
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
      } catch (error: any) {
        // only reject when the timeout expires, otherwise ignore the error
        // and retry on the next interval
        if (timesToCheck <= 0) {
          clearInterval(timer);
          return reject(error);
        }
        // reject immediately for user action
        if (error instanceof AbortWaitError) {
          clearInterval(timer);
          return reject(error);
        }
      }
      // decrement the number of times to check in each iteration
      timesToCheck -= 1;
    }, interval);
  });
};

/**
 * Thrown inside a conditionFunc to immediately abort waitFor without retrying.
 * Used for states that need user action
 */
export class AbortWaitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbortWaitError';
  }
}
