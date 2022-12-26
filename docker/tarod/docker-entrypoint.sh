#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id taro > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user tarod ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID taro
  useradd -r -u $USERID -g $GROUPID taro
  chown -R $USERID:$GROUPID /home/taro
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for tarod"

  set -- tarod "$@"
fi

if [ "$1" = "tarod" ] || [ "$1" = "tarocli" ]; then
  echo "Running as taro user: $@"
  exec gosu taro "$@"
fi

echo "$@"
exec "$@"
