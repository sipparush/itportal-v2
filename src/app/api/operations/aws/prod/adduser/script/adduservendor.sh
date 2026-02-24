#!/bin/bash

# Update at 20 Jun 2024 21:26 by Sipparush Laekan

if [ $1 = '-h' ]; then
   echo "$> ./adduservendor.sh <system> <user>"
   exit
fi


[ $2 == '' ] && exit

[ -f $1 ] && system=`cat $1` || system=$1
[ -f $2 ] && users=`cat $2` || users=$2


#while read -r ip; do
for ip in $system; do
        echo "=== Process in $ip ==="

          for user in $users; do
            echo "Creating account: $user"

 ssh -i ~/jventures-prod.pem jventures@18.139.55.93 "ssh -o StrictHostKeyChecking=no jventures@$ip 'bash -s'" << EOF

# Add a new user with a specified shell, groups, and password
sudo useradd -s /bin/bash -G sudo,docker -p \$(perl -e 'print crypt("changeme",  "sha512")') -c "\`date \"+%F\"\`" -m ${user}

# Set password aging policy for the new user
sudo chage -M 60 -m 0 -W 7 -I 30 -E $(date -d "+90 days" +%Y-%m-%d) $user
sudo chage -l $user

# Install sshpass
sudo apt-get install -y sshpass

# Switch to the new user and run commands as the new user
sudo su - ${user} << 'EOSU'

# Generate SSH key for the new user
ssh-keygen -t ed25519 -N "changeme" -f ~/.ssh/id_ed25519

# Move the public key to authorized keys
mv ~/.ssh/*.pub ~/.ssh/authorized_keys

# Create a destination filename based on user ID and hostname
dstfname=\$(echo \$(id | cut -d' ' -f1 | cut -d'(' -f2 | sed 's/)//g')_\$(hostname).pem)

# Move the keys and list the SSH directory
mv ~/.ssh/id_* ~/.ssh/\$dstfname
ls -l ~/.ssh

# Secure copy the .pem file to another server using sshpass
sshpass -p 'Jvc@dm1n' scp -o StrictHostKeyChecking=no ~/.ssh/*.pem jventures@10.241.15.15:

EOSU
EOF

      done
      done
