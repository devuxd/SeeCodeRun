rm -rf "/var/tmp/Chrome dev session"
mkdir "/var/tmp/Chrome dev session"
open -na /Applications/Google\ Chrome\ Canary.app --args  --new-window --user-data-dir="/var/tmp/Chrome dev session" --disable-web-security "localhost:3000"
