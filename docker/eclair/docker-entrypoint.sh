#!/usr/bin/env bash
set -e

# give bitcoind a second to bootup
sleep 1

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id eclair > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user eclair ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID eclair
  useradd -r -u $USERID -g $GROUPID eclair
  # ensure correct ownership of user home dir
  mkdir -p /home/eclair
  chown eclair:eclair /home/eclair
fi

if [ "$1" = "polar-eclair" ]; then
  # convert command line args to JAVA_OPTS
  JAVA_OPTS=""
  for arg in "$@"
  do
    if [ "${arg:0:2}" = "--" ]; then
      JAVA_OPTS="$JAVA_OPTS -Declair.${arg:2}"
    fi
  done
  # trim leading/trailing whitespace
  JAVA_OPTS="$(sed -e 's/[[:space:]]*$//' <<<${JAVA_OPTS})"

  echo "Running as eclair user:"
  echo "java $JAVA_OPTS -jar eclair-node.jar"
  exec gosu eclair java $JAVA_OPTS -jar eclair-node.jar
fi

echo "$@"
exec "$@"
