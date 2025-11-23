#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id lnd > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user lnd ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID lnd
  useradd -r -u $USERID -g $GROUPID lnd
  chown -R $USERID:$GROUPID /home/lnd
fi

usermod -a -G debian-tor lnd
mkdir -p /var/lib/tor/lnd-service
chown -R debian-tor:debian-tor /var/lib/tor
chmod 755 /var/lib/tor
chmod 700 /var/lib/tor/lnd-service

if [ "${ENABLE_TOR}" = "true" ]; then
  echo "Starting Tor service..."

   # Set default ports if not provided
  TOR_SOCKS_PORT=${TOR_SOCKS_PORT:-9050}
  TOR_CONTROL_PORT=${TOR_CONTROL_PORT:-9051}

  # Generate torrc file with dynamic ports
  cat > /etc/tor/torrc <<EOF
# Config
SocksPort 127.0.0.1:${TOR_SOCKS_PORT}
ControlPort 127.0.0.1:${TOR_CONTROL_PORT}
CookieAuthentication 1
DataDirectory /var/lib/tor
Log notice stdout

# Hidden service settings (optional - for LND Tor address)
HiddenServiceDir /var/lib/tor/lnd-service
HiddenServiceVersion 3
HiddenServicePort 9735 127.0.0.1:9735
HiddenServicePort 8080 127.0.0.1:8080
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
    # Get the lnd group ID
    LND_GID=$(getent group lnd | cut -d: -f3)
    # Change the cookie file's group to lnd
    chown debian-tor:$LND_GID "$COOKIE_FILE"
    chmod 640 "$COOKIE_FILE"
    # Fix directory permissions - Tor sets this to 700, but we need 755 
    # so lnd user can traverse into the directory
    chmod 755 /var/lib/tor
    echo "Tor auth cookie created and permissions set for SAFECOOKIE auth"
  else
    echo "WARNING: Tor auth cookie not found after ${TIMEOUT} seconds"
  fi
else
  echo "Tor service disabled (ENABLE_TOR != 'true')"
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lnd"

  set -- lnd "$@"
fi

if [ "$1" = "lnd" ] || [ "$1" = "lncli" ]; then
  echo "Running as lnd user: $@"
  exec gosu lnd "$@"
fi

echo "$@"
exec "$@"
