#########################
# Original Source: https://github.com/ACINQ/eclair/blob/v0.12.0/Dockerfile
#########################
FROM eclipse-temurin:25.0.1_8-jdk-alpine as BUILD

# Let's fetch eclair dependencies, so that Docker can cache them
# This way we won't have to fetch dependencies again if only the source code changes
# The easiest way to reliably get dependencies is to build the project with no sources
#################### Polar Modification
# No need to copy local files
# Original lines:
# WORKDIR /usr/src
# COPY mvnw mvnw
# COPY .mvn .mvn
# COPY pom.xml pom.xml
# COPY eclair-core/pom.xml eclair-core/pom.xml
# COPY eclair-front/pom.xml eclair-front/pom.xml
# COPY eclair-node/pom.xml eclair-node/pom.xml
# COPY eclair-node/modules/assembly.xml eclair-node/modules/assembly.xml
# RUN mkdir -p eclair-core/src/main/scala && touch eclair-core/src/main/scala/empty.scala
# # Blank build. We only care about eclair-node, and we use install because eclair-node depends on eclair-core
# RUN ./mvnw install -pl eclair-node -am
# RUN ./mvnw clean
#
# Only then do we copy the sources
# COPY . .
####################

#################### Polar Modification
# Pull source code from github instead of a local repo
RUN apk add git

WORKDIR /usr/repo
ARG ECLAIR_VERSION
RUN git clone --branch=v${ECLAIR_VERSION} https://github.com/ACINQ/eclair.git .
# Let's fetch eclair dependencies, so that Docker can cache them
WORKDIR /usr/src
RUN cp -r /usr/repo/mvnw mvnw
RUN cp -r /usr/repo/.mvn .mvn
RUN cp /usr/repo/pom.xml pom.xml
RUN mkdir -p eclair-core && cp /usr/repo/eclair-core/pom.xml eclair-core/pom.xml
RUN mkdir -p eclair-front && cp /usr/repo/eclair-front/pom.xml eclair-front/pom.xml
RUN mkdir -p eclair-node && cp /usr/repo/eclair-node/pom.xml eclair-node/pom.xml
RUN mkdir -p eclair-node/modules && cp /usr/repo/eclair-node/modules/assembly.xml eclair-node/modules/assembly.xml
RUN mkdir -p eclair-core/src/main/scala && touch eclair-core/src/main/scala/empty.scala
# Blank build. We only care about eclair-node, and we use install because eclair-node depends on eclair-core
ENV MAVEN_OPTS=-Xmx512m -XX:MaxPermSize=1024m
RUN ./mvnw install -pl eclair-node -am
RUN ./mvnw clean
# Only then do we copy the sources
RUN cp -R -f /usr/repo/* .
####################

# And this time we can build in offline mode, specifying 'notag' instead of git commit
RUN ./mvnw package -pl eclair-node -am -DskipTests -Dgit.commit.id=notag -Dgit.commit.id.abbrev=notag -o
# It might be good idea to run the tests here, so that the docker build fail if the code is bugged

FROM eclipse-temurin:25.0.1_8-jre-alpine
WORKDIR /app

# install jq for eclair-cli
RUN apk add bash jq curl unzip su-exec tor

# copy and install eclair-cli executable
COPY --from=BUILD /usr/src/eclair-core/eclair-cli .
RUN chmod +x eclair-cli && mv eclair-cli /sbin/eclair-cli

# we only need the eclair-node.zip to run
COPY --from=BUILD /usr/src/eclair-node/target/eclair-node-*.zip ./eclair-node.zip
RUN unzip eclair-node.zip && mv eclair-node-* eclair-node && chmod +x eclair-node/bin/eclair-node.sh

#################### Polar Modification
# Original lines:
# ENV ECLAIR_DATADIR=/data
# ENV JAVA_OPTS=
# RUN mkdir -p "$ECLAIR_DATADIR"
# VOLUME [ "/data" ]
# ENTRYPOINT JAVA_OPTS="${JAVA_OPTS}" eclair-node/bin/eclair-node.sh "-Declair.datadir=${ECLAIR_DATADIR}"
ENV ECLAIR_DATADIR=/home/eclair/
RUN chmod -R a+x eclair-node/*
RUN ls -al eclair-node/bin

RUN curl -SLO https://raw.githubusercontent.com/ACINQ/eclair/master/contrib/eclair-cli.bash-completion \
  && mkdir -p /etc/bash_completion.d \
  && mv eclair-cli.bash-completion /etc/bash_completion.d/ \
  && curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mkdir /usr/share/bash-completion/ \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/eclair/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/eclair"]

EXPOSE 9735 8080 9050 9051

ENTRYPOINT ["/entrypoint.sh"]

CMD JAVA_OPTS="${JAVA_OPTS}" eclair-node/bin/eclair-node.sh "-Declair.datadir=${ECLAIR_DATADIR}"
####################
