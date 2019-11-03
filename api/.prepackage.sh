#!/bin/bash

BUNDLE_ZIP="html-bundle.zip"
SERVE_DIR=".webpack/serve"

if [ -d "${SERVE_DIR}" ]; then
  cp "${BUNDLE_ZIP}" "${SERVE_DIR}"
  echo "Add ${BUNDLE_ZIP} to ${SERVE_DIR}"
else
  echo "Skip because ${SERVE_DIR} doesn't exist."
fi
