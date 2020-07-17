# wildwatch-mobile
**WildWatch** is an app which helps people keep track of wildlife, it provides a map to add and view information on wildlife collected by both professionals and enthusiasts. It provides tools to narrow down a certain search pattern, and a way to provide data to a centralized database and get credit for the collected data, the collected data will be used in another open project.

## Download
```sh
git clone --depth 1 --single-branch --branch mobile https://github.com/AlyShmahell/WildWatch wildwatch-mobile
```

## Install Requirements for wildwatch-mobile
open a terminal inside **wildwatch-mobile**, then:
```sh
npm install
```
## Browser-Test wildwatch-mobile

### Download, Compile Requirements for & Run the wildwatch-restful Backend Server
instructions can be found at the restful branch of this repository: [https://github.com/AlyShmahell/WildWatch/tree/restful](https://github.com/AlyShmahell/WildWatch/tree/restful)

### Build wildwatch-mobile
open a terminal inside **wildwatch-mobile**, then:
```sh
ionic build
```

### Run wildwatch-mobile
open a terminal inside **wildwatch-mobile**, then:
```sh
ionic serve
```

## Android-Test wildwatch-mobile
### Prepare code for compilation
```
npx cap add android
npx cap copy android
npx jetify
npx cap sync android
```
**You may need to change the url_endpoints inside your project from `127.0.0.1` to something else according to the following documentation [https://developer.android.com/studio/run/emulator-networking.html](https://developer.android.com/studio/run/emulator-networking.html) in order to connect properly to `wildwatch-restful` from within the android emulator.**
### Compile
- Open Android Studio
- Open wildwatch-mobile/android/app as the project. (wait for it to build or click build yourself).
### Run
- start the project inside the emulator.
- change the proxy settings inside the emulator according to the following documentation [https://developer.android.com/studio/run/emulator-networking.html](https://developer.android.com/studio/run/emulator-networking.html).
- start the app inside the emulator.
