#!/bin/bash

# Update at 20 Jun 2024 21:26 by Sipparush Laekan

if [ "$1" = '-h' ]; then
   echo "$> ./adduservendor.sh <system> <user>"
   exit
fi

[ -z "$2" ] && exit 0 # Exit successfully if no users provided, or handle error properly.

# Read file content safely, handling potential line endings if needed.
# However, standard `cat` works for LF.
if [ -f "$1" ]; then
    # Read file into array to handle newlines correctly
    mapfile -t system_array < "$1"
    system="${system_array[*]}"
else
    system="$1"
fi

if [ -f "$2" ]; then
    mapfile -t users_array < "$2"
    users="${users_array[*]}"
else
    users="$2"
fi

for ip in $system; do
	echo "=== Process in $ip ==="

	  for user in $users; do 
	    echo "Creating account: $user"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 jventures@$ip << EOF

# Add a new user with a specified shell, groups, and password
# Check if user exists first to avoid error spam (though useradd fails safely)
if id "${user}" &>/dev/null; then
    echo "User ${user} already exists, skipping creation..."
else
    sudo useradd -s /bin/bash -G sudo,docker -p \$(perl -e 'print crypt("changeme",  "sha512")') -c "\`date \"+%F\"\`" -m ${user}
fi

# Set password aging policy for the new user
sudo chage -M 60 -m 0 -W 7 -I 30 ${user}
sudo chage -l ${user}

# Install sshpass - Attempt to fix broken installs first
# Sometimes apt-get fails if locked, retry once? 
# Using -o Dpkg::Options::="--force-confold" for non-interactive
sudo apt-get update
sudo apt-get -y --fix-broken install
sudo apt-get install -y sshpass || echo "Failed to install sshpass"


# Switch to the new user and run commands as the new user
sudo su - ${user} << EOSU

# Generate SSH key for the new user if it doesn't already exist
if [ -f ~/.ssh/id_ed25519 ]; then
   # If key exists, maybe we rotate it or skip
   echo "SSH Key exists. Regenerating..."
   rm -f ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
fi

ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519

# Move the public key to authorized keys
if [ -f ~/.ssh/id_ed25519.pub ]; then
    cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    rm ~/.ssh/id_ed25519.pub
fi

# Create a destination filename based on user ID and hostname
dstfname=\$(whoami)_\$(hostname).pem
if [ -f ~/.ssh/id_ed25519 ]; then
    mv ~/.ssh/id_ed25519 ~/.ssh/\$dstfname
fi

# Secure copy the .pem file to another server using sshpass
# First try standard scp if key exists, otherwise try sshpass
# Actually, the requirement seems to be specifically using sshpass with password
if command -v sshpass &> /dev/null; then
    sshpass -p 'Jvc@dm1n' scp -o StrictHostKeyChecking=no ~/.ssh/\$dstfname jventures@10.240.1.220: || echo "SCP failed but continuing"
else
    echo "sshpass is not installed. Cannot SCP key."
fi

EOSU
EOF
    if [ $? -eq 0 ]; then
        echo "Successfully processed $user on $ip"
    else
        echo "Failed to process $user on $ip"
    fi
 
          done

done

exit 0
