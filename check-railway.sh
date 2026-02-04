#!/bin/bash

cd python-service

echo "Monitoring Railway deployment..."
echo ""

for i in {1..20}; do
  status=$(railway status --json 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  echo "Check #$i - Status: $status"

  if [ "$status" != "BUILDING" ]; then
    echo ""
    echo "Deployment completed with status: $status"
    echo ""
    echo "Checking service health..."
    curl -s https://anomalyint-production.up.railway.app/health
    echo ""
    echo ""
    echo "Recent logs:"
    railway logs --service anomalyint 2>&1 | tail -50
    break
  fi

  if [ $i -lt 20 ]; then
    echo "Still building... checking again in 30 seconds"
    sleep 30
  fi
done
