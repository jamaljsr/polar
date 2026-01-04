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
  addgroup -g $GROUPID eclair
  adduser -D -u $USERID -G eclair eclair
  # ensure correct ownership of user home dir
  mkdir -p /home/eclair
  chown -R $USERID:$GROUPID /home/eclair
fi

if getent group tor > /dev/null; then
  addgroup eclair tor
fi

mkdir -p /var/lib/tor/eclair-service
if getent passwd tor > /dev/null; then
  chown -R tor:tor /var/lib/tor
fi
chmod 755 /var/lib/tor
chmod 700 /var/lib/tor/eclair-service

if [ "${ENABLE_TOR}" = "true" ]; then
  echo "Starting Tor service..."

   # Set default ports 
  TOR_SOCKS_PORT=${TOR_SOCKS_PORT:-9050}
  TOR_CONTROL_PORT=${TOR_CONTROL_PORT:-9051}

  # Generate torrc file 
  cat > /etc/tor/torrc <<EOF
# Config
SocksPort 127.0.0.1:${TOR_SOCKS_PORT}
ControlPort 127.0.0.1:${TOR_CONTROL_PORT}
CookieAuthentication 1
ExitPolicy reject *:*

DataDirectory /var/lib/tor
Log notice stdout

EOF

  su-exec tor tor &
  TOR_PID=$!

  # Wait for Tor to create the auth cookie and set proper permissions
  echo "Waiting for Tor to create auth cookie..."
  COOKIE_FILE="/var/lib/tor/control_auth_cookie"
  TIMEOUT=30
  ELAPSED=0
  
  while [ ! -f "$COOKIE_FILE" ] && [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 0.5
    ELAPSED=$((ELAPSED + 1))
  done
  
  if [ -f "$COOKIE_FILE" ]; then
    # Get the eclair group ID
    ECLAIR_GID=$(getent group eclair | cut -d: -f3)
    # Change the cookie file's group to eclair
    chown tor:$ECLAIR_GID "$COOKIE_FILE"
    chmod 640 "$COOKIE_FILE"
    # Fix directory permissions - Tor sets this to 700, but we need 755 
    # so eclair user can traverse into the directory
    chmod 755 /var/lib/tor
    echo "Tor auth cookie created and permissions set"
  else
    echo "WARNING: Tor auth cookie not found after ${TIMEOUT} seconds"
  fi
else
  echo "Tor service disabled (ENABLE_TOR != 'true')"
fi

if [ "$1" = "polar-eclair" ]; then
  # convert command line args to JAVA_OPTS
  JAVA_OPTS=""
  for arg in "$@"
  do
    if [ "${arg:0:21}" = "--server.public-ips.0" ]; then
      # Skip adding public IP when Tor is enabled - let Eclair only announce the onion address
      if [ "${ENABLE_TOR}" != "true" ]; then
        # replace the hostname provided in this arg with the IP address of the containing 
        # because Eclair v8+ began including the DNS hostname in the NodeAnnouncements and
        # LND throws an error when parsing these messages
        JAVA_OPTS="$JAVA_OPTS -Declair.server.public-ips.0=$(hostname -i)"
      fi
    elif [ "${arg:0:2}" = "--" ]; then
      JAVA_OPTS="$JAVA_OPTS -Declair.${arg:2}"
    fi
  done
  # trim leading/trailing whitespace
  JAVA_OPTS="$(sed -e 's/[[:space:]]*$//' <<<${JAVA_OPTS})"

  echo "Running as eclair user:"
  echo "bash eclair-node/bin/eclair-node.sh $JAVA_OPTS"
  exec su-exec eclair bash eclair-node/bin/eclair-node.sh $JAVA_OPTS
fi

echo "Running: $@"
exec "$@"
