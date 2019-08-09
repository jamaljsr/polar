import { Selector } from 'testcafe';

class Counter {
  counter: Selector = Selector('[data-tid=counter]');
  increment: Selector = Selector('[data-tid=incr-btn]');
  decrement: Selector = Selector('[data-tid=decr-btn]');
  incrementOdd: Selector = Selector('[data-tid=odd-btn]');
  incrementAsync: Selector = Selector('[data-tid=async-btn]');
  loadingIcon: Selector = Selector('[data-tid=async-loader]');
  error: Selector = Selector('[data-tid=error]');

  getCounterText = () => this.counter.innerText;
  getErrorText = () => this.error.innerText;
}

export default new Counter();
