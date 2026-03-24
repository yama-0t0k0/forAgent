#!/bin/bash

# yama/scripts/fix_simulator_network.sh
# This script resolves persistent network connectivity issues in the iOS Simulator.

SIMULATOR_ID="BCC2A6F4-51F9-40B9-8E40-645593BAC76F" # iPhone 13

echo "--- [1/4] Shutting down all simulators ---"
xcrun simctl shutdown all

echo "--- [2/4] Restarting CoreSimulator service and clearing caches ---"
# Kill the background service (it will restart automatically)
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null
# Clear simulator caches
rm -rf ~/Library/Developer/CoreSimulator/Caches/* 2>/dev/null

echo "--- [3/4] Erasing iPhone 13 simulator (Resetting network stack) ---"
xcrun simctl erase "$SIMULATOR_ID"

echo "--- [4/4] Rebooting simulator and verifying connectivity ---"
xcrun simctl boot "$SIMULATOR_ID"
open -a Simulator

echo "Waiting for simulator to boot..."
sleep 15

echo "Verifying network path status..."
xcrun simctl spawn booted log show --last 1m --predicate 'subsystem == "com.apple.network"' | grep -E "satisfied|viable" | tail -n 5

echo "--------------------------------------------------------"
echo "Simulator network reset complete."
echo "Please verify connectivity by opening Safari in the simulator."
echo "--------------------------------------------------------"
