---
author: "Gabriel Garrido"
date: 2020-01-17
linktitle: Cloud native applications with kubebuilder and kind aka kubernetes operators
title: Cloud native applications with kubebuilder and kind aka kubernetes operators
highlight: true
tags:
- go
- golang
- kubernetes
- linux
- security
- docker
- kustomize
- kubebuilder
- kind
categories:
- kubernetes
lua:
  image:
    url: "/img/forward.jpg"
---

##### **Introduction**
In this article we will see how to use [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) and [Kind](https://github.com/kubernetes-sigs/kind) to create a local test cluster and an operator, then deploy that operator in the cluster and test it, the repository with the files can be found here: [forward](https://github.com/kainlite/forward).

Basically what the code does is create an alpine/socat pod and you can specify the host, port and protocol and it will make a tunnel for you, so then you can use port-forward or a service or ingress or whatever to expose things that are in another private subnet, while this might not sound like a good idea it has some use cases, so check your security constraints before doing any of that in a normal scenario it should be safe, it can be useful for testing or for reaching a DB while doing some debugging or test, but well, that is for another discussion, the tools used here is what makes this so interesting, this is a cloud native application, since it native to kubernetes and that's what we will explore here.

While Kind is not actually a requirement I used that for testing and really liked it, it's faster and simpler than minikube.

##### **Prerequisites**
* [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder)
* [kustomize](https://github.com/kubernetes-sigs/kustomize)
* [Go 1.13](https://golang.org/dl/)
* [Kind](https://github.com/kubernetes-sigs/kind)
* [Docker](https://hub.docker.com/?overlay=onboarding)

##### Create the project
In this step we need to create the kubebuilder project, so in an empty folder we run:
{{< gist kainlite  fcb512051b1f9aa1abb7ee9d8fd177f5 >}}

##### Create the API
Next let's create an API, something for us to have control of (our controller).
{{< gist kainlite 99c415e6bbaf6d92b2c971acddc42221 >}}

Right until here we only have some boilerplate and basic or empty project with defaults, if you test it now it will work, but it won't do anything interesting, but it covers a lot of ground and we should be grateful that such a tool exists.

##### Add our code to the mix
First we will add it to `api/v1beta1/map_types.go`, which will add our fields to our type.
{{< gist kainlite 6e823ba4160fb12b9414494c9b16be7b >}}
Basically we just edited the `MapSpec` and the `MapStatus` struct.

Now we need to add the code to our controller in `controllers/map_controller.go`
{{< gist kainlite d2e59c468a6864a96647054ac616285d >}}
In this controller we added two functions one to create a pod and modified basically the entire Reconcile function (this one takes care of checking the status and make the transitions in other words makes a controller work like a controller), also notice the kubebuilder annotations which will generate the rbac config for us, pretty handy! right?

##### Starting the cluster
Now we will use [Kind](https://github.com/kubernetes-sigs/kind) to create a local cluster to test
{{< gist kainlite 3d5c7eb58a0ede8e34f0824d927deeca >}}
it could be that easy!?!?! yes, it is!

##### Running our operator locally
For testing you can run your operator locally like this:
{{< gist kainlite 8184c8ae455e033602b81965cacf593b >}}

##### Testing it
First we spin up a pod, and launch `nc -l -p 8000`
{{< gist kainlite d940b280bd2f3fdf732b9b259e9da841 >}}

Then we edit our manifest and apply it, check that everything is in place, and do the port-forward and launch another `nc localhost 8000` to test if everything went well.
First the manifest
{{< gist kainlite d609ef25c2bc621d365781e6f3d9826b >}}
Then the port-forward and test
{{< gist kainlite d9455e6a17b2a396f486d48cf159f5f2 >}}

##### Making it publicly ready
Here we just build and push the docker image to dockerhub or our favorite public registry.
{{< gist kainlite c45158dd378d09b82c8153dbdd122953 >}}
Then you can install it with `make deploy IMG=kainlite/forward:0.0.1` and uninstall it with `make uninstall`

##### **Closing notes**
Be sure to check the [kubebuilder book](https://book.kubebuilder.io/) if you want to learn more and the [kind docs](https://kind.sigs.k8s.io/docs/user/quick-start), I hope you enjoyed it and hope to see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
