#!/bin/bash

set -eou pipefail
cd $(dirname "$(dirname "$0")" ) # cd to parent dir

platform=$(uname)
ip=""

if [[ "$platform" == 'Linux' ]]; then

	ip=$(ifconfig eth0 | grep 'inet ' | awk '{print $2}')
	sed -i "s/^CANDIDATE=.*/CANDIDATE=\"$ip\"/" .env
elif [[ "$platform" == 'Darwin' ]]; then

	ip=$(ifconfig en0 inet | grep 'inet ' | awk '{print $2}')
	sed -i "" "s/^CANDIDATE=.*/CANDIDATE=\"$ip\"/" .env
else
	echo "Unsupported platform: $platform. Please open an issue on GitHub with your platform so it can be added."
	exit 1
fi

echo "CANDIDATE set to $ip"
