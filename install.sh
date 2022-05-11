#!/bin/bash
set -e

echo '> Installing server dependencies'
yarn

echo '> Installing client dependencies'
cd client
yarn