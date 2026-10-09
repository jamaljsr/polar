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


if [ "${ENABLE_TOR}" = "true" ]; then
  if getent group debian-tor > /dev/null 2>&1; then
    usermod -a -G debian-tor lnd
  fi

  echo "Starting Tor service..."
  mkdir -p /var/lib/tor/lnd-service
  chown -R debian-tor:debian-tor /var/lib/tor
  chmod 700 /var/lib/tor
  chmod 700 /var/lib/tor/lnd-service

  # Generate torrc 
  cat > /etc/tor/torrc <<EOF
# Tor configuration for LND
DataDirectory /var/lib/tor
Log notice stdout

SocksPort 127.0.0.1:9050
ControlPort 127.0.0.1:9051
CookieAuthentication 1
CookieAuthFile /var/lib/tor/control_auth_cookie
CookieAuthFileGroupReadable 1
DataDirectoryGroupReadable 1

HiddenServiceDir /var/lib/tor/lnd-service
HiddenServiceVersion 3
HiddenServicePort 9735 127.0.0.1:9735
HiddenServicePort 8080 127.0.0.1:8080
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
  echo "Tor fully bootstrapped: $(cat /var/lib/tor/lnd-service/hostname)"
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
