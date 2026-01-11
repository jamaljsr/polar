#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id litd > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user litd ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID litd
  useradd -r -u $USERID -g $GROUPID litd
  chown -R $USERID:$GROUPID /home/litd
fi

usermod -a -G debian-tor litd
mkdir -p /var/lib/tor/litd-service
chown -R debian-tor:debian-tor /var/lib/tor
chmod 755 /var/lib/tor
chmod 700 /var/lib/tor/litd-service

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
HiddenServiceDir /var/lib/tor/litd-service
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
    # Get the litd group ID
    LITD_GID=$(getent group litd | cut -d: -f3)
    # Change the cookie file's group to litd
    chown debian-tor:$LITD_GID "$COOKIE_FILE"
    chmod 640 "$COOKIE_FILE"
    # Fix directory permissions - Tor sets this to 700, but we need 755 
    # so litd user can traverse into the directory
    chmod 755 /var/lib/tor
    echo "Tor auth cookie created and permissions set for SAFECOOKIE auth"
  else
    echo "WARNING: Tor auth cookie not found after ${TIMEOUT} seconds"
  fi
else
  echo "Tor service disabled (ENABLE_TOR != 'true')"
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for litd"

  set -- litd "$@"
fi

if [ "$1" = "litd" ] || [ "$1" = "litcli" ]; then
  echo "Running as litd user: $@"
  exec gosu litd "$@"
fi

echo "$@"
exec "$@"
