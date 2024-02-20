#!/bin/sh
set -e

# Check if the 'btcd' user exists, if not, create it
if ! id btcd > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "Adding user btcd ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID btcd
  useradd -r -u $USERID -g $GROUPID btcd
  chown -R $USERID:$GROUPID /home/btcd
fi

# Prefix arguments with 'btcd' if needed
if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for btcd"
  set -- btcd "$@"
fi

# Execute commands as the 'btcd' user
if [ "$1" = "btcd" ]; then
  echo "Running as btcd user: $@"
  exec gosu btcd "$@"
fi

echo "$@"
exec "$@"
