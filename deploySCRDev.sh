#!/bin/sh
npm --prefix scr-app/ run build-dev
firebase use development
export NODE_ENV=development
firebase deploy
firebase use default