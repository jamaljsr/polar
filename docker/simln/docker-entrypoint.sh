#!/bin/sh

####################
# Original Source: https://github.com/bitcoin-dev-project/sim-ln/blob/main/docker/entrypoint.sh
####################

# Define the start command
START_COMMAND="/usr/local/bin/sim-cli --sim-file $SIMFILE_PATH"

# Check if a custom data directory was provided
if [[ ! -z ${DATA_DIR} ]]; then
    START_COMMAND="$START_COMMAND --data-dir $DATA_DIR"
fi

# Check for version arg
if [[ ! -z ${VERSION} ]]; then
    START_COMMAND="$START_COMMAND --version"
fi

# Check for help arg
if [[ ! -z ${HELP} ]]; then
    START_COMMAND="$START_COMMAND --help"
fi

# Check for log level arg
if [[ ! -z ${LOG_LEVEL} ]]; then
    START_COMMAND="$START_COMMAND --log-level $LOG_LEVEL"
fi

# Check for total time arg
if [[ ! -z ${TOTAL_TIME} ]]; then
    START_COMMAND="$START_COMMAND --total-time $TOTAL_TIME"
fi

# Check for print-batch-size arg
if [[ ! -z ${PRINT_BATCH_SIZE} ]]; then
    START_COMMAND="$START_COMMAND --print-batch-size $PRINT_BATCH_SIZE"
fi

# start the container
exec $START_COMMAND