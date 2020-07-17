# wildwatch-web
**WildWatch** is an app which helps people keep track of wildlife, it provides a map to add and view information on wildlife collected by both professionals and enthusiasts. It provides tools to narrow down a certain search pattern, and a way to provide data to a centralized database and get credit for the collected data, the collected data will be used in another open project.

## Download
```sh
git clone --depth 1 --single-branch --branch web https://github.com/AlyShmahell/WildWatch wildwatch-web
```

## Pre-Requirements
- python 3.7
- pip for python 3.7
- **wildwatch-restful:** instructions can be found at the restful branch of this repository: [https://github.com/AlyShmahell/WildWatch/tree/restful](https://github.com/AlyShmahell/WildWatch/tree/restful)

## Installation
open a terminal inside **wildwatch-web**, then:
```sh
pip install -r requirements.txt
```

## Operation
```sh
python server.py --this_ip "127.0.0.1" --this_port 5002 --rest_ip "http://127.0.0.1" --rest_port 5001
```