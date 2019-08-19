export const getNetwork = (): Network => ({
  id: 0,
  name: 'my-test',
  nodes: {
    bitcoin: [
      {
        id: 0,
        name: 'bitcoind1',
        type: 'bitcoin',
      },
    ],
    lightning: [
      {
        id: 0,
        name: 'alice',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
      {
        id: 0,
        name: 'bob',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
    ],
  },
});
