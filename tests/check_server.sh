#!/bin/bash
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

# check_server.sh
# This script checks if the Streamlit server is up and running.
# If it is, it exits with code 0 (success).
# If it isn't, it exits with code 1 (failure).

# Notably, this is required because Streamlit takes a while to startup
# on some platforms, and this leads to tests running before the server
# is ready to accept connections -- which we don't want

PORT=8555
RETRIES=30

for ((i=1;i<=RETRIES;i++)); do
  if nc -z localhost $PORT; then
    echo "Streamlit is up!"
    exit 0
  else
    echo "Waiting for Streamlit to start..."
    sleep 2
  fi
done

echo "Streamlit failed to start"
exit 1