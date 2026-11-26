#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id btcd > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user btcd ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID btcd
  useradd -r -u $USERID -g $GROUPID btcd
  chown -R $USERID:$GROUPID /home/btcd
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for btcd"

  set -- btcd "$@"
fi

if [ "$1" = "btcd" ] || [ "$1" = "btcctl" ]; then
  echo "Running as btcd user: $@"
  exec gosu btcd "$@"
fi

echo "$@"
exec "$@"
