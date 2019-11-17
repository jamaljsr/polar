#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id clightning > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user clightning ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID clightning
  useradd -r -u $USERID -g $GROUPID clightning
  # create the .bitcoin dir for bitcoin-cli
  mkdir -p /home/clightning/.bitcoin
  chown clightning:clightning /home/clightning/.bitcoin
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lightningd"

  set -- lightningd "$@"
fi

if [ "$1" = "lightningd" ] || [ "$1" = "lightning-cli" ]; then
  echo "Running as clightning user: $@"
  exec gosu clightning "$@"
fi

echo
exec "$@"
