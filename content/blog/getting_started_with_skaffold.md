---
author: "Gabriel Garrido"
date: 2019-01-03
linktitle: Getting started with skaffold
title: Getting started with skaffold
highlight: true
tags: [kubernetes, deployments]
categories: [deployment tools]
---

### **Skaffold**

This time we will see how to get started with [Skaffold](https://github.com/GoogleContainerTools/skaffold), it seems a relatively mature project, and it does a lot more than some of the previous explored alternatives: _Skaffold is a command line tool that facilitates continuous development for Kubernetes applications. You can iterate on your application source code locally then deploy to local or remote Kubernetes clusters. Skaffold handles the workflow for building, pushing and deploying your application. It also provides building blocks and describe customizations for a CI/CD pipeline._ (Extracted from [github](https://github.com/GoogleContainerTools/skaffold))

In this example I will be using [Digital Ocean](https://m.do.co/c/01d040b789de) (that's my referral link), note that I do not have any association with Digital Ocean but they give you $100 to test their products for 60 days, if you spend $25 I get another $25, I got the idea from [Pelado Nerd Spanish Youtube Channel](https://www.youtube.com/watch?v=fhYSKEy0s8w).

### Let's get started
Once you have created your account and added your credit card you will get the $100 of free credit, then you will have to go to Manage on the left side panel and click on Kubernetes, then create your cluster with the amount of nodes that you consider necessary but remember to power them off or delete these resources so you don't waste the free credit or your credit card itself. Once you have created your cluster and downloaded the kubectl config you're ready to go.

We will be working with the chat bot again you can see the original [article here](https://kainlite.github.io/blog/go_echobot/), and the repo [here](https://github.com/kainlite/echobot/tree/skaffold).

Let's tell our kubectl to use our recently downloaded config:
```plain
$ export KUBECONFIG=/home/kainlite/Downloads/k8s-1-13-1-do-2-nyc1-1546545313076-kubeconfig.yaml
$ kubectl get nodes -o wide

NAME                 STATUS    ROLES     AGE       VERSION   EXTERNAL-IP       OS-IMAGE                       KERNEL-VERSION   CONTAINER-RUNTIME
crazy-wozniak-8306   Ready     <none>    6h        v1.13.1   178.128.154.205   Debian GNU/Linux 9 (stretch)   4.9.0-8-amd64    docker://18.9.0
crazy-wozniak-830t   Ready     <none>    6h        v1.13.1   167.99.224.115    Debian GNU/Linux 9 (stretch)   4.9.0-8-amd64    docker://18.9.0
```
Your config might have a slightly different name, but it should be similar. We can see in the output a lot of information about our nodes (workers).

But let's cut to the chase, we are here for _Skaffold_:
```plain
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/v0.20.0/skaffold-linux-amd64 && chmod +x skaffold && sudo mv skaffold /usr/local/bin
```
You can install the binary using the provided line (linux) or downloading it from the [releases page](https://github.com/GoogleContainerTools/skaffold/releases).

Once installed we can see the [examples](https://github.com/GoogleContainerTools/skaffold/tree/master/examples), I will be using the getting-started example:
```
apiVersion: skaffold/v1beta2
kind: Config
build:
  artifacts:
  - image: kainlite/echobot
deploy:
  kubectl:
    manifests:
      - k8s-*
```
With very litle YAML we can accomplish a lot.

We need a manifest file that matches that pattern so skaffold can deploy/re-deploy our application, so let's generate one with `kubectl run echobot --image=kainlite/echobot --dry-run -o yaml`
```plain
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  labels:
    run: echobot
  name: echobot
spec:
  replicas: 1
  selector:
    matchLabels:
      run: echobot
  strategy: {}
  template:
    metadata:
      labels:
        run: echobot
    spec:
      containers:
      - image: kainlite/echobot
        name: echobot
        env:
        - name: SLACK_API_TOKEN
          value: really_long_token
        livenessProbe:
          exec:
            command:
            - '/bin/sh'
            - '-c'
            - '/app/health_check.sh'
```
The above command can be used to generate any kind of k8s resource :), I stripped it a bit, because there were fields that I didn't want in and added some that we need for it to work.

Then the only thing left to do is testing that everything works properly:
```plain
$ skaffold build

Starting build...
Building [kainlite/echobot]...
Sending build context to Docker daemon  66.56kB
Step 1/12 : FROM golang:1.11.2-alpine as builder
 ---> 57915f96905a
Step 2/12 : WORKDIR /app
 ---> Using cache
 ---> e04488a7f16b
Step 3/12 : RUN adduser -D -g 'app' app &&     chown -R app:app /app &&     apk add git && apk add gcc musl-dev
 ---> Running in 1339601fff6f
fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/community/x86_64/APKINDEX.tar.gz
(1/6) Installing nghttp2-libs (1.32.0-r0)
(2/6) Installing libssh2 (1.8.0-r3)
(3/6) Installing libcurl (7.61.1-r1)
(4/6) Installing expat (2.2.5-r0)
(5/6) Installing pcre2 (10.31-r0)
(6/6) Installing git (2.18.1-r0)
Executing busybox-1.28.4-r1.trigger
OK: 19 MiB in 20 packages
(1/12) Installing binutils (2.30-r5)
(2/12) Installing gmp (6.1.2-r1)
(3/12) Installing isl (0.18-r0)
(4/12) Installing libgomp (6.4.0-r9)
(5/12) Installing libatomic (6.4.0-r9)
(6/12) Installing pkgconf (1.5.3-r0)
(7/12) Installing libgcc (6.4.0-r9)
(8/12) Installing mpfr3 (3.1.5-r1)
(9/12) Installing mpc1 (1.0.3-r1)
(10/12) Installing libstdc++ (6.4.0-r9)
(11/12) Installing gcc (6.4.0-r9)
(12/12) Installing musl-dev (1.1.19-r10)
Executing busybox-1.28.4-r1.trigger
OK: 113 MiB in 32 packages
 ---> 0e7a97e577dc
Step 4/12 : ADD . /app/
 ---> 72cfd4dea99b
Step 5/12 : RUN go get -d -v ./... && go build -o main . && chown -R app:app /app /home/app
 ---> Running in 4482bfd3e8f7
go: finding github.com/gorilla/websocket v1.4.0
go: finding github.com/nlopes/slack v0.4.0
go: finding github.com/pkg/errors v0.8.0
go: downloading github.com/nlopes/slack v0.4.0
go: downloading github.com/pkg/errors v0.8.0
go: downloading github.com/gorilla/websocket v1.4.0
 ---> 8ea604c7fb37
Step 6/12 : FROM golang:1.11.2-alpine
 ---> 57915f96905a
Step 7/12 : WORKDIR /app
 ---> Using cache
 ---> e04488a7f16b
Step 8/12 : RUN adduser -D -g 'app' app &&     chown -R app:app /app
 ---> Using cache
 ---> 33b206dba7e4
Step 9/12 : COPY --from=builder --chown=app /app/health_check.sh /app/health_check.sh
 ---> Using cache
 ---> 34d3cd1a5bb0
Step 10/12 : COPY --from=builder --chown=app /app/main /app/main
 ---> Using cache
 ---> 0c3d838b25dc
Step 11/12 : USER app
 ---> Using cache
 ---> 95c2bf90800c
Step 12/12 : CMD ["/app/main"]
 ---> Using cache
 ---> 3541257ff16c
Successfully built 3541257ff16c
Successfully tagged 1fca8a8c999a8cd9b943456b70d90807:latest
The push refers to repository [docker.io/kainlite/echobot]
ee06a8f42495: Preparing
12468476a0ef: Preparing
ec122f36b39d: Preparing
e94f3271cc73: Preparing
93391cb9fd4b: Preparing
cb9d0f9550f6: Preparing
93448d8c2605: Preparing
c54f8a17910a: Preparing
df64d3292fd6: Preparing
cb9d0f9550f6: Waiting
c54f8a17910a: Waiting
93448d8c2605: Waiting
e94f3271cc73: Layer already exists
93391cb9fd4b: Layer already exists
12468476a0ef: Layer already exists
ec122f36b39d: Layer already exists
ee06a8f42495: Layer already exists
93448d8c2605: Layer already exists
cb9d0f9550f6: Layer already exists
df64d3292fd6: Layer already exists
c54f8a17910a: Layer already exists
fc03e3d-dirty-3541257: digest: sha256:99c6d3d5b226a1947e8f96c0a5f963c8e499848d271f121ad50551046a0dc7ca size: 2197
Build complete in 48.642618413s
Starting test...
Test complete in 9.15µs
kainlite/echobot -> kainlite/echobot:fc03e3d-dirty-3541257
```
As we can see skaffold build not only did the docker build but also tagged and pushed the image to [docker hub](https://cloud.docker.com/repository/docker/kainlite/echobot/tags), which is really nice and really useful to build a CI/CD system with it.

But wait, we need to deploy that to our cluster, right on:
```plain
$ skaffold deploy
Starting build...
Building [kainlite/echobot]...
Sending build context to Docker daemon  66.56kB
Step 1/12 : FROM golang:1.11.2-alpine as builder
 ---> 57915f96905a
Step 2/12 : WORKDIR /app
 ---> Using cache
 ---> e04488a7f16b
Step 3/12 : RUN adduser -D -g 'app' app &&     chown -R app:app /app &&     apk add git && apk add gcc musl-dev
 ---> Using cache
 ---> 0e7a97e577dc
Step 4/12 : ADD . /app/
 ---> Using cache
 ---> 72cfd4dea99b
Step 5/12 : RUN go get -d -v ./... && go build -o main . && chown -R app:app /app /home/app
 ---> Using cache
 ---> 8ea604c7fb37
Step 6/12 : FROM golang:1.11.2-alpine
 ---> 57915f96905a
Step 7/12 : WORKDIR /app
 ---> Using cache
 ---> e04488a7f16b
Step 8/12 : RUN adduser -D -g 'app' app &&     chown -R app:app /app
 ---> Using cache
 ---> 33b206dba7e4
Step 9/12 : COPY --from=builder --chown=app /app/health_check.sh /app/health_check.sh
 ---> Using cache
 ---> 34d3cd1a5bb0
Step 10/12 : COPY --from=builder --chown=app /app/main /app/main
 ---> Using cache
 ---> 0c3d838b25dc
Step 11/12 : USER app
 ---> Using cache
 ---> 95c2bf90800c
Step 12/12 : CMD ["/app/main"]
 ---> Using cache
 ---> 3541257ff16c
Successfully built 3541257ff16c
Successfully tagged 510226574761304cc9d64a343d5bdbff:latest
The push refers to repository [docker.io/kainlite/echobot]
ee06a8f42495: Preparing
12468476a0ef: Preparing
ec122f36b39d: Preparing
e94f3271cc73: Preparing
93391cb9fd4b: Preparing
cb9d0f9550f6: Preparing
93448d8c2605: Preparing
c54f8a17910a: Preparing
df64d3292fd6: Preparing
cb9d0f9550f6: Waiting
93448d8c2605: Waiting
c54f8a17910a: Waiting
df64d3292fd6: Waiting
12468476a0ef: Layer already exists
e94f3271cc73: Layer already exists
cb9d0f9550f6: Layer already exists
ec122f36b39d: Layer already exists
93391cb9fd4b: Layer already exists
ee06a8f42495: Layer already exists
c54f8a17910a: Layer already exists
df64d3292fd6: Layer already exists
93448d8c2605: Mounted from library/golang
fc03e3d-dirty-3541257: digest: sha256:99c6d3d5b226a1947e8f96c0a5f963c8e499848d271f121ad50551046a0dc7ca size: 2197
Build complete in 15.136865292s
Starting test...
Test complete in 17.912µs
Starting deploy...
kubectl client version: 1.10
kubectl version 1.12.0 or greater is recommended for use with skaffold
deployment.extensions "echobot" configured
Deploy complete in 5.676513226s
```
Deploy does a lot like with gitkube, it build the image, pushes it to the registry and then makes the deployment to the cluster, as you can see in there skaffold relies on kubectl and I have an old version of it.

After a few seconds we can see that our deployment has been triggered and we have a new pod being created for it.
```plain
$ kubectl get pods
NAME                       READY     STATUS              RESTARTS   AGE
echobot-57fdcccf76-4qwvq   0/1       ContainerCreating   0          5s
echobot-6fcd78658c-njvpx   0/1       Terminating         0          9m
```
Skaffold also has another nice option that it's called _dev_ it watches the folder for changes and re-deploys the app so you can focus on code.

Let's clean up and call it a day:
```plain
skaffold delete
Cleaning up...
deployment.extensions "echobot" deleted
Cleanup complete in 3.833219278s
```

### Notes
I really liked the workflow that skaffold provides, I hope that I can use it some more in the near future. And remember to shutdown the kubernetes cluster if you are using Digital Ocean so you don't get charged by surprise later on.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
