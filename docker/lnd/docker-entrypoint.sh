#!/bin/sh
set -e

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lnd"

  set -- lnd "$@"
fi

if [ "$1" = "lnd" ] || [ "$1" = "lncli" ]; then
  echo
  exec gosu lnd "$@"
fi

echo
exec "$@"
