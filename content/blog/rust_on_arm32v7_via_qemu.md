---
author: "Gabriel Garrido"
date: 2022-09-03
linktitle: Running Rust on ARM32v7 via QEMU.
title: Running Rust on ARM32v7 via QEMU.
highlight: true
tags:
  - rust
  - arm
categories:
  - arm
images:
  - "/img/rust.jpg"
---

#### **Introduction**

In this article we will explore how to use [QEMU](https://www.qemu.org/download/#linux) to run emulating the ARM32v7 
architecture to build and run [Rust](https://www.rust-lang.org/) code like if it was a native 
[ARM32v7 architecture](https://github.com/docker-library/official-images#architectures-other-than-amd64).

There are some drawbacks and performance considerations when using this approach, it can be simpler but way slower for
big projects.

The source for this article is here [RCV](https://github.com/kainlite/rcv/) and the docker image is 
[here](https://hub.docker.com/repository/docker/kainlite/rcv).

This article can be considered a part 2 of 
[Running rust on ARM32v7K3S Oracle cluster](https://techsquad.rocks/blog/rust_on_arm32v7/) 
so we will not be creating the rust project and all that here, but focusing on building and running the project.

##### **Prerequisites**

- [Docker](https://hub.docker.com/?overlay=onboarding)
- [Buildah](https://github.com/containers/buildah/blob/main/install.md)
- [QEMU](https://www.qemu.org/download/#linux)
- [Rust](https://www.rust-lang.org/tools/install)

### Let's jump to the example

#### The new Dockerfile
You will notice that this [Dockerfile](https://raw.githubusercontent.com/kainlite/rcv/master/Dockerfile.armv7v2) 
is way simpler than the ones from the previous article, since it runs natively
as ARM32v7, the main difference is the base image being `arm32v7/rust:1.63.0`, this can be further extended for more
architectures, see this [article](https://devopstales.github.io/home/running_and_building_multi_arch_containers/) for 
more information.
{{< gist kainlite d983d330e95fd48c28313689d5d37215 >}}

#### Last steps for QEMU/Docker
After installing the required packages you will still need to perform some simple steps in order for it to work with
docker and buildah, the first command is needed for docker to be able to use the required QEMU emulation and the second
is just to validate that everything works fine
{{< gist kainlite 988c38925f7518764ef333f0453c3f7a >}}

##### Short names error
If you get an error about short names when pulling images add the following line to your `/etc/containers/registries.conf`
file
{{< gist kainlite 21157cba08e63ab9c4ba8d3fa396dd3e >}}

#### Lets build it
For the build we will use buildah because it is smarter than docker for this kind of scenarios.
{{< gist kainlite 9c6ada7b91ac45aac9bc399c3a4aa921 >}}

#### Lets test it
After building it, we can push it to the docker daemon and then run it and test it from another terminal
{{< gist kainlite 4c13e33ab16c66b05efdb06a19465be1 >}}

Notice: you will see some warnings about the architecture, that's fine as we are emulating things.

#### Performance considerations
This project build with the rust toolchain and then copied to an ARM32v7 image took 2 minutes, but using QEMU and the
given emulation it took around 8 minutes and a half, so it is something to be aware since the difference is quite big.

#### Extra

You can see it running [here](http://rcv.techsquad.rocks/), a very basic HTML Curriculum vitae.

For more details and to see how everything fits together I encourage you to clone the repo, test it, and modify it to
make your own.

#### **Closing notes**
Be sure to check the links if you want to learn more about the examples, I hope you enjoyed it, 
see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

The source for this article is [here](https://github.com/kainlite/rcv/)

### Errata

If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io)
and the [sources here](https://github.com/kainlite/blog)
