#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id bitcoin > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user bitcoin ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID bitcoin
  useradd -r -u $USERID -g $GROUPID bitcoin
  chown -R $USERID:$GROUPID /home/bitcoin
fi

usermod -a -G debian-tor bitcoin
mkdir -p /var/lib/tor/bitcoin-service
chown -R debian-tor:debian-tor /var/lib/tor
chmod 700 /var/lib/tor
chmod 700 /var/lib/tor/bitcoin-service

if [ "${ENABLE_TOR}" = "true" ]; then
  echo "Starting Tor service for Bitcoin..."

  # Set default ports if not provided
  TOR_SOCKS_PORT=${TOR_SOCKS_PORT:-9050}
  TOR_CONTROL_PORT=${TOR_CONTROL_PORT:-9051}

  # Generate torrc file with dynamic ports and Bitcoin hidden service
  cat > /etc/tor/torrc <<EOF
# Tor configuration for Bitcoin
SocksPort 127.0.0.1:${TOR_SOCKS_PORT}
ControlPort 127.0.0.1:${TOR_CONTROL_PORT}
CookieAuthentication 1

DataDirectory /var/lib/tor
Log notice stdout

HiddenServiceDir /var/lib/tor/bitcoin-service
HiddenServicePort 8333 127.0.0.1:8333

EOF

  gosu debian-tor tor &
  TOR_PID=$!

  echo "Waiting for Tor to create auth cookie..."
  COOKIE_FILE="/var/lib/tor/control_auth_cookie"
  TIMEOUT=30
  ELAPSED=0

  while [ ! -f "$COOKIE_FILE" ] && [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 0.5
    ELAPSED=$((ELAPSED + 1))
  done

  if [ -f "$COOKIE_FILE" ]; then
    # Get the bitcoin group ID
    GID=$(getent group bitcoin | cut -d: -f3)
    # Change the cookie file's group to bitcoin
    chown debian-tor:$GID "$COOKIE_FILE"
    chmod 640 "$COOKIE_FILE"
    # Fix directory permissions so bitcoin user can traverse into the directory
    chmod 755 /var/lib/tor
    echo "Tor auth cookie created and permissions set for SAFECOOKIE auth"
  else
    echo "WARNING: Tor auth cookie not found after ${TIMEOUT} seconds"
  fi
else
  echo "Tor service disabled (ENABLE_TOR != 'true')"
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for bitcoind"

  set -- bitcoind "$@"
fi

if [ "$1" = "bitcoind" ] || [ "$1" = "bitcoin-cli" ] || [ "$1" = "bitcoin-tx" ]; then
  echo "Running as bitcoin user: $@"
  exec gosu bitcoin "$@"
fi

echo "$@"
exec "$@"
