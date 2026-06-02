#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id ldk > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user ldk ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID ldk
  useradd -r -u $USERID -g $GROUPID ldk
  chown -R $USERID:$GROUPID /home/ldk
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for ldk-server"

  set -- ldk-server "$@"
fi

if [ "$1" = "ldk-server" ]; then
  echo "Running as ldk user: $@"
  exec gosu ldk "$@"
fi

echo "$@"
exec "$@"
