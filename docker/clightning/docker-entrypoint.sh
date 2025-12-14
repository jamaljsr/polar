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


if [ "${ENABLE_TOR}" = "true" ]; then
  if getent group debian-tor > /dev/null 2>&1; then
    usermod -a -G debian-tor clightning
  fi

  echo "Starting Tor service for Clightning..."
  mkdir -p /var/lib/tor/clightning-service
  chown -R debian-tor:debian-tor /var/lib/tor
  chmod 700 /var/lib/tor
  chmod 700 /var/lib/tor/clightning-service

  # Generate torrc file
  cat > /etc/tor/torrc <<EOF
# Tor configuration for Clightning
DataDirectory /var/lib/tor
Log notice stdout

SocksPort 127.0.0.1:9050
ControlPort 127.0.0.1:9051
CookieAuthentication 1
CookieAuthFile /var/lib/tor/control_auth_cookie
CookieAuthFileGroupReadable 1
DataDirectoryGroupReadable 1

HiddenServiceDir /var/lib/tor/clightning-service
HiddenServiceVersion 3
HiddenServicePort 9735 127.0.0.1:9735

EOF
  touch /tmp/tor.log
  gosu debian-tor tor 2>&1 | tee /tmp/tor.log &
  echo "Waiting for Tor to fully bootstrap..."
  TIMEOUT=120
  ELAPSED=0
  until grep -q "Bootstrapped 100%" /tmp/tor.log; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "Tor failed to bootstrap within ${TIMEOUT}s"
      exit 1
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
  done
  echo "Tor fully bootstrapped: $(cat /var/lib/tor/clightning-service/hostname)"
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
