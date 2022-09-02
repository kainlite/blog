---
author: "Gabriel Garrido"
date: 2022-09-02
linktitle: Running Rust on ARM32v7 K3S Oracle cluster.
title: Running Rust on ARM32v7 K3S Oracle cluster.
highlight: true
tags:
  - kubernetes
  - rust
  - arm
categories:
  - kubernetes
images:
  - "/img/rust.jpg"
---

#### **Introduction**

In this article we will explore how to create a sample [Rust](https://www.rust-lang.org/) project and Dockerfile to 
run it on [ARM32v7 architectures](https://github.com/docker-library/official-images#architectures-other-than-amd64).

To configure the cluster I used this project [k3s-oci-cluster](https://github.com/garutilorenzo/k3s-oci-cluster), since
Oracle is providing a very generous free tier for ARM workloads you might as well give it a try, or maybe use your 
raspberry pi cluster.

The source for this article is here [RCV](https://github.com/kainlite/rcv/) and the docker image is 
[here](https://hub.docker.com/repository/docker/kainlite/rcv).

##### **Prerequisites**

The cluster is optional if you have any device using linux on ARM32v7 or ARM64v8 you should be able to use the docker
examples.
- [k3s-oci-cluster](https://github.com/garutilorenzo/k3s-oci-cluster)
- [Docker](https://hub.docker.com/?overlay=onboarding)
- [Rust](https://www.rust-lang.org/tools/install)

### Let's jump to the example

#### Creating the project

Lets create a new Rust project with Cargo, as you might notice we will get a very basic project that will help us get 
get started:
{{< gist kainlite dec4806ac2bd054ac6a58526956485e7 >}}

#### Our example and the dependencies
I was thinking in processing markdown files and show them as html, so that's basically what the code does, it's far from
optimal but it is good enough to illustrate the example, first lets add some crates for the webserver 
([Actix](https://actix.rs/docs/server/)) and converting [markdown to html](https://github.com/johannhof/markdown.rs).
{{< gist kainlite 8605014563ae858f179fcbb596a5b1da>}}

#### Lets add some code
This simple snippet only listens for `GET` requests to `/` and logs a line with the unix timestamp and IP and returns 
the contents of the file `cv.md` which is my Curriculum Vitae.
{{< gist kainlite eadfce805786f3caf113abdc9e5fcc69 >}}

#### Example logs
Example logs 
{{< gist kainlite df717357716c57d30c4d11ca8819da06 >}}

At this point we have enough to run and test locally, but what about other architectures? (I'm running on linux-amd64),
you can test it locally if you want running `cargo run`.

#### ARM32v7 Dockerfile
This Dockerfile can be optimized and secured in many ways, but for the sake of simplicity it is good enough to start 
working on something, also we will provide the security at runtime via kubernetes APIs.
We need to consider two things here, first we need to create an ARM32v7 binary using Rust, then we need a Docker image
for that architecture so that's basically what the Dockerfile does.
{{< gist kainlite 7f2747cc8088a5ac38ccae4e69ef6be7 >}}

#### Building and pushing (docker image)
So lets build it and push it [here](https://hub.docker.com/repository/docker/kainlite/rcv).
{{< gist kainlite f342c8200afd2c6172e8b8c215a208f6 >}}

### lets quickly review the manifests
The manifests are fairly simple, you can see them there, as you can see we are restricting the user and privileges of
the container using the SecurityContext of the pod and the container.
{{< gist kainlite df0cd2665e5b7f824bb455d72646c339 >}}

#### Deploying it
Assuming you already have a cluster up and running, this can be deployed like this, you will see a deployment, a service
and the ingress resources, you will also need to have a DNS entry if you want to use it like I did there:
{{< gist kainlite b422bac1abf81433b117b608904227bb >}}

#### Extra

You can see it running [here](http://rcv.techsquad.rocks/), a very basic HTML Curriculum vitae.

For more details and to see how everything fits together I encourage you to clone the repo, test it, and modify it to
make your own.

### Cleaning up
To clean up the resources you can do this:
{{< gist kainlite 6b09642cb04b42953fcdfd0792255ff6 >}}

#### **Closing notes**
Be sure to check the links if you want to learn more about the examples, I hope you enjoyed it, 
see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

The source for this article is [here](https://github.com/kainlite/rcv/)

### Errata

If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io)
and the [sources here](https://github.com/kainlite/blog)
