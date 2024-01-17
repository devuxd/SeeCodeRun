#!/bin/sh
node --max-old-space-size=10000 $(which npm) --max-old-space-size=10000 --prefix scr-app/ run build --verbose
firebase use production
firebase deploy
firebase use default
