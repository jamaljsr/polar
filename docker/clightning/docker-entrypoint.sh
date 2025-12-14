#!/bin/sh
set -e

# give bitcoind a second to bootup
sleep 1

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id clightning > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user clightning ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID clightning
  useradd -r -u $USERID -g $GROUPID clightning
  # ensure correct ownership of user home dir
  mkdir -p /home/clightning
  chown -R $USERID:$GROUPID /home/clightning
fi

usermod -a -G debian-tor clightning
mkdir -p /var/lib/tor/clightning-service
chown -R debian-tor:debian-tor /var/lib/tor
chmod 700 /var/lib/tor
chmod 700 /var/lib/tor/clightning-service

if [ "${ENABLE_TOR}" = "true" ]; then
  echo "Starting Tor service for Clightning..."

  # Set default ports if not provided
  TOR_SOCKS_PORT=${TOR_SOCKS_PORT:-9050}
  TOR_CONTROL_PORT=${TOR_CONTROL_PORT:-9051}

  # Generate torrc file with dynamic ports and Clightning hidden service
  cat > /etc/tor/torrc <<EOF
# Tor configuration for Clightning
SocksPort 127.0.0.1:${TOR_SOCKS_PORT}
ControlPort 127.0.0.1:${TOR_CONTROL_PORT}
CookieAuthentication 0

DataDirectory /var/lib/tor
Log notice stdout

HiddenServiceDir /var/lib/tor/clightning-service
HiddenServiceVersion 3
HiddenServicePort 1234 127.0.0.1:9735

EOF

  gosu debian-tor tor &
  TOR_PID=$!

else
  echo "Tor service disabled (ENABLE_TOR != 'true')"
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lightningd"

  set -- lightningd "$@"
fi

# TODO: investigate hsmd error on Windows
# https://gist.github.com/jamaljsr/404c20f99be2f77fff2d834e2449158b

if [ "$1" = "lightningd" ] || [ "$1" = "lightning-cli" ]; then
  echo "Running as clightning user: $@"
  exec gosu clightning "$@"
fi

echo "$@"
exec "$@"
