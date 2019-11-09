#!/bin/sh
set -e

if ! id lnd > /dev/null 2>&1; then
  echo "adding user lnd ($USERID:$GROUPID)"
  groupadd -g $GROUPID lnd
  useradd -r -u $USERID -g $GROUPID lnd 
fi

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
