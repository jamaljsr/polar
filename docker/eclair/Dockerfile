#########################
# Original Source: https://github.com/ACINQ/eclair/blob/v0.3.3/Dockerfile
#########################
FROM adoptopenjdk/openjdk11:jdk-11.0.3_7-alpine as BUILD

# Setup maven, we don't use https://hub.docker.com/_/maven/ as it declare .m2 as volume, we loose all mvn cache
# We can alternatively do as proposed by https://github.com/carlossg/docker-maven#packaging-a-local-repository-with-the-image
# this was meant to make the image smaller, but we use multi-stage build so we don't care
RUN apk add --no-cache curl tar bash git

ARG MAVEN_VERSION=3.6.3
ARG USER_HOME_DIR="/root"
ARG SHA=c35a1803a6e70a126e80b2b3ae33eed961f83ed74d18fcd16909b2d44d7dada3203f1ffe726c17ef8dcca2dcaa9fca676987befeadc9b9f759967a8cb77181c0
ARG BASE_URL=https://apache.osuosl.org/maven/maven-3/${MAVEN_VERSION}/binaries

RUN mkdir -p /usr/share/maven /usr/share/maven/ref \
  && curl -fsSL -o /tmp/apache-maven.tar.gz ${BASE_URL}/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
  && echo "${SHA}  /tmp/apache-maven.tar.gz" | sha512sum -c - \
  && tar -xzf /tmp/apache-maven.tar.gz -C /usr/share/maven --strip-components=1 \
  && rm -f /tmp/apache-maven.tar.gz \
  && ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

ENV MAVEN_HOME /usr/share/maven
ENV MAVEN_CONFIG "$USER_HOME_DIR/.m2"

# Let's fetch eclair dependencies, so that Docker can cache them
# This way we won't have to fetch dependencies again if only the source code changes
# The easiest way to reliably get dependencies is to build the project with no sources
#################### Polar Modification
# No need to copy local files
# Original lines:
# WORKDIR /usr/src
# COPY pom.xml pom.xml
# COPY eclair-core/pom.xml eclair-core/pom.xml
# COPY eclair-node/pom.xml eclair-node/pom.xml
# COPY eclair-node-gui/pom.xml eclair-node-gui/pom.xml
# COPY eclair-node/modules/assembly.xml eclair-node/modules/assembly.xml
# COPY eclair-node-gui/modules/assembly.xml eclair-node-gui/modules/assembly.xml
# RUN mkdir -p eclair-core/src/main/scala && touch eclair-core/src/main/scala/empty.scala
# # Blank build. We only care about eclair-node, and we use install because eclair-node depends on eclair-core
# RUN mvn install -pl eclair-node -am
# RUN mvn clean
#
# Only then do we copy the sources
# COPY . .
####################

#################### Polar Modification
# Pull source code from github instead of a local repo
WORKDIR /usr/repo
ARG ECLAIR_VERSION
RUN git clone --branch=v${ECLAIR_VERSION} https://github.com/ACINQ/eclair.git .
# Let's fetch eclair dependencies, so that Docker can cache them
WORKDIR /usr/src
RUN cp /usr/repo/pom.xml pom.xml
RUN mkdir -p eclair-core && cp /usr/repo/eclair-core/pom.xml eclair-core/pom.xml
RUN mkdir -p eclair-front && cp /usr/repo/eclair-front/pom.xml eclair-front/pom.xml
RUN mkdir -p eclair-node && cp /usr/repo/eclair-node/pom.xml eclair-node/pom.xml
RUN mkdir -p eclair-node/modules && cp /usr/repo/eclair-node/modules/assembly.xml eclair-node/modules/assembly.xml
RUN mkdir -p eclair-core/src/main/scala && touch eclair-core/src/main/scala/empty.scala
# Blank build. We only care about eclair-node, and we use install because eclair-node depends on eclair-core
ENV MAVEN_OPTS=-Xmx256m -XX:MaxPermSize=512m
RUN mvn install -pl eclair-node -am
RUN mvn clean
# Only then do we copy the sources
RUN cp -R -f /usr/repo/* .
####################

# And this time we can build in offline mode, specifying 'notag' instead of git commit
RUN mvn package -pl eclair-node -am -DskipTests -Dgit.commit.id=notag -Dgit.commit.id.abbrev=notag -o
# It might be good idea to run the tests here, so that the docker build fail if the code is bugged

# We currently use a debian image for runtime because of some jni-related issue with sqlite
FROM openjdk:11.0.16-jre-slim
WORKDIR /app

# install jq for eclair-cli
RUN apt-get update && apt-get install -y bash jq curl unzip gosu

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
  && mkdir /etc/bash_completion.d \
  && mv eclair-cli.bash-completion /etc/bash_completion.d/ \
  && curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/eclair/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/eclair"]

EXPOSE 9735 8080

ENTRYPOINT ["/entrypoint.sh"]

CMD JAVA_OPTS="${JAVA_OPTS}" eclair-node/bin/eclair-node.sh "-Declair.datadir=${ECLAIR_DATADIR}"
####################
