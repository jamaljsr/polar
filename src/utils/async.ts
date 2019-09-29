/**
 * Returns a promise that will ressolve when the return value of the conditionFunc is true
 * @param conditionFunc the function to execute which determines when the call succeeds. Must return a Promise
 * @param interval the number of ms between each execution of the conditionFunc
 * @param timeout the absolute timeout to abort checking the codition and return false
 */
export const waitFor = async (
  conditionFunc: () => Promise<boolean>,
  interval = 500,
  timeout = 5000,
): Promise<boolean> => {
  // if the file already exists, then return immediately
  if (await conditionFunc()) {
    return Promise.resolve(true);
  }
  // return a promise that will resolve when the file exists
  return new Promise(resolve => {
    // keep a countdown of the number of times to check
    // so it can abort after a the timeout expires
    let timesToCheck = timeout / interval;
    const timer = setInterval(async () => {
      if (await conditionFunc()) {
        clearInterval(timer);
        return resolve(true);
      }
      if (timesToCheck < 0) {
        clearInterval(timer);
        return resolve(false);
      }
      // decrement the number of times to check in each iteration
      timesToCheck -= 1;
    }, interval);
  });
};
