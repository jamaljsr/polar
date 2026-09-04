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


if [ "${ENABLE_TOR}" = "true" ]; then
  if getent group debian-tor > /dev/null 2>&1; then
    usermod -a -G debian-tor litd
  fi

  echo "Starting Tor service..."
  mkdir -p /var/lib/tor/litd-service
  chown -R debian-tor:debian-tor /var/lib/tor
  chmod 700 /var/lib/tor
  chmod 700 /var/lib/tor/litd-service

  # Generate torrc file 
  cat > /etc/tor/torrc <<EOF
# Tor configuration for LITD
DataDirectory /var/lib/tor
Log notice stdout

SocksPort 127.0.0.1:9050
ControlPort 127.0.0.1:9051
CookieAuthentication 1
CookieAuthFile /var/lib/tor/control_auth_cookie
CookieAuthFileGroupReadable 1
DataDirectoryGroupReadable 1

HiddenServiceDir /var/lib/tor/litd-service
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
  echo "Tor fully bootstrapped: $(cat /var/lib/tor/litd-service/hostname)"
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
