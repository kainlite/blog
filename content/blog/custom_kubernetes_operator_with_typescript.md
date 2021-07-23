---
author: "Gabriel Garrido"
date: 2021-07-22
linktitle: Custom Kubernetes Operator With TypeScript (Typed JavaScript).
title: Custom Kubernetes Operator With TypeScript (JavaScript).
highlight: true
tags:
  - kubernetes
  - javascript
  - typescript
  - operators
categories:
  - kubernetes
images:
  - "/img/operator-ts-js.png"
---

#### **Introduction**

In this article we will explore how to create a sample operator using typescript and to deploy it to our cluster, the operator will be pretty dummy in the sense that it will only deploy some resources based in a CRD, but you can customize it to do whatever you might need or want, the idea is to get an idea of all that it takes to do an operator outside of the magic land of [Go](https://golang.org/) and [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder).

If you want to check past articles that explore other alternative frameworks and languages go to:

- [Cloud native applications with kubebuilder and kind aka kubernetes operators](/blog/cloud_native_applications_with_kubebuilder_and_kind_aka_kubernetes_operators/).
- [Testing the Operator SDK and making a prefetch mechanism for Kubernetes](/blog/testing_the_operator_sdk_and_making_a_prefetch_mechanism_for_kubernetes/).

You will notice that both are very similar and it is because the operator-sdk uses kubebuilder.

The source for this article is here [TypeScript Operator](https://github.com/kainlite/ts-operator/) and the docker image is [here](https://github.com/kainlite/ts-operator/pkgs/container/ts-operator), also this article is based in this example from Nodeshift's [Operator in JavaScript](https://github.com/nodeshift-blog-examples/operator-in-JavaScript).

##### **Prerequisites**

- [Kind](https://github.com/kubernetes-sigs/kind)
- [Docker](https://hub.docker.com/?overlay=onboarding)
- [kustomize](https://github.com/kubernetes-sigs/kustomize)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)

### Let's jump to the example

#### Creating the cluster

We will need a cluster to run and test our operator, so kind is pretty straight forward and lightweight enough to run anywhere.
{{< gist kainlite 53f54d81934666457a46cb667f8cea58 >}}

#### Creating our operator

Creating all necessary resources for our operator to work
{{< gist kainlite b11dd1e9dddb4e60a32961a911cbd9d3 >}}

#### Deploying our operator

Creating our custom resource to see the operator in action
{{< gist kainlite 374b311fd746a81a2d67a9e4c75e73b4 >}}

#### Logs from the operator

Example logs based in the creation, update and deletion of our custom resource
{{< gist kainlite eb9862192efa7a08ad964713b688a6e0 >}}

#### Brief comparison operator-sdk vs custom operator?

There are some main differences to have in mind, in Go you:

- Have code generation from the framework for RBAC, controllers, etc.
- Out of the box tooling to build, deploy and manage your operator.

In TypeScript or JavaScript you have to handle more things which can be easily done from a CI system, In this example I used github actions to build the image and the example already had everything else configured to make typescript usable with kubernetes as an example.

#### Building and pushing (docker image)

In this case we don't have to do that it will be managed by actions using the free container registry that they provide, it will build and push the image matching the branch name, notice that it is fully transparent, you don't need to configure anything on the repo, you can see the result [here](https://github.com/kainlite/ts-operator/pkgs/container/ts-operator).
{{< gist kainlite 75c8ed737de39be95573942604ce3d21 >}}

#### Building and pushing (docker image)

Bonus: if you want to run the operator locally when developing or debugging you can do so easily with `ts-node`, like this:
{{< gist kainlite f9bd40bfa9b3157dbd072e03bbc2200a >}}
The reason I used it like this was mostly to assume zero configuration, and it is possible because ts-node is listed as a development dependency.

### Now let's see the code

Enough words, let's see code, I have added comments and changed the original code a bit
{{< gist kainlite 672d2aabb44d1a988ce77e3df5da7495 >}}

#### The `deployment.json` file

This file basically is what gets deployed when we create our custom resource
{{< gist kainlite d143f7fc382ae5db3fc3ea89bfdb142a >}}

#### And finally our custom resource

This is how we tell our operator that we need our operator to create some resources for a given task
{{< gist kainlite 7121ff367b6ea7c997f40eaa12c21dae >}}

#### Extra

For more details and to see how everything fits together I encourage you to clone the repo, test it, and modify it yourself.

### Cleaning up

To clean up the operator from the cluster you can do this
{{< gist kainlite 59aada5bfbaab0309b1e6108a4de2298 >}}

#### **Closing notes**

Be sure to check the links if you want to learn more about the examples from Nodeshift and I hope you enjoyed it, see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

- https://github.com/nodeshift/nodeshift

The source for this article is [here](https://github.com/kainlite/ts-operator/)

DISCLAIMER: I'm not using OpenShift, but all examples are easily translatables to a vanilla cluster.

### Errata

If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
