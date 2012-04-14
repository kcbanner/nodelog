#!/bin/sh
NODE=node
APP="app.js"
NODE_ENV="production"
PROJDIR=`pwd`
PIDFILE="$PROJDIR/pids/nodelog.pid"
LOGFILE="$PROJDIR/logs/nodelog.log"

cd $PROJDIR
if [ -f $PIDFILE ]; then
    kill `cat -- $PIDFILE`
    rm -f -- $PIDFILE
fi

NODE_ENV=$NODE_ENV $NODE $APP 2>&1 >> $LOGFILE &
PID=$!
echo "Node started, pid: $PID"
echo $PID > $PIDFILE
