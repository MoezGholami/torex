#!/bin/bash

USERNAME=""
PASSWORD=""
REPOSITORY_NAME=""

(
git clone https://github.com/$USERNAME/$REPOSITORY_NAME
cd "$REPOSITORY_NAME"
git config --local user.name $USERNAME
git config --local user.email $EMAIL
git config --local user.password $PASSWORD
git config remote.origin.url \
	https://$USERNAME:$PASSWORD@github.com/$USERNAME/$REPOSITORY_NAME.git

i=$(tail -n 1 hello.txt)
if [ "$i" -gt "1" ]; then
    echo $(($i-1)) >> hello.txt;
    git add .
    git commit -m "commit $(($i-1))"
    git push origin master
fi;

) > /dev/null 2>&1
