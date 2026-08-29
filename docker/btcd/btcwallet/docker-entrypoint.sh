#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id btcwallet > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user btcwallet ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID btcwallet
  useradd -r -u $USERID -g $GROUPID btcwallet
  chown -R $USERID:$GROUPID /home/btcwallet
fi

# Run wallet creation script if needed
if [ "$1" = "btcwallet" ]; then
  echo "Checking if wallet needs to be created..."
  gosu btcwallet /create-wallet.sh
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for btcwallet"
  set -- btcwallet "$@"
fi

if [ "$1" = "btcwallet" ]; then
  echo "Running as btcwallet user: $@"
  exec gosu btcwallet "$@"
fi

echo "$@"
exec "$@"
