#!/bin/sh
set -e

if ! id bitcoin > /dev/null 2>&1; then
  echo "adding user bitcoin ($USERID:$GROUPID)"
  groupadd -g $GROUPID bitcoin
  useradd -r -u $USERID -g $GROUPID bitcoin 
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for bitcoind"

  set -- bitcoind "$@"
fi

if [ "$1" = "bitcoind" ] || [ "$1" = "bitcoin-cli" ] || [ "$1" = "bitcoin-tx" ]; then
  echo
  exec gosu bitcoin "$@"
fi

echo
exec "$@"