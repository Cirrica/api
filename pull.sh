#!/bin/bash
git pull origin main
npm install
pm2 restart all
# Restart your app here if needed, e.g. pm2 restart all
