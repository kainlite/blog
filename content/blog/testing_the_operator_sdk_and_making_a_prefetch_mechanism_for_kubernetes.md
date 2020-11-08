---
author: "Gabriel Garrido"
date: 2020-11-01
linktitle: Testing the Operator SDK and making a prefetch mechanism for Kubernetes
title: Testing the Operator SDK and making a prefetch mechanism for Kubernetes
highlight: true
tags:
- kubernetes
- go
- golang
categories:
- kubernetes
images:
  - "/img/operator-sdk.png"
---

#### **Introduction**
In this article we will explore how to create an operator that can prefetch our images (from our deployments to all nodes) using the Operator SDK, you might be wondering why would you want to do this? the main idea is to get the images in advance so you don't have to pull them when the pod actually needs to start running in a given node, this can speed up things a bit and it's also an interesting exercise.

If you have read the article [Cloud native applications with kubebuilder and kind aka kubernetes operators](/blog/cloud_native_applications_with_kubebuilder_and_kind_aka_kubernetes_operators/) you will note that the commands are really similar between each other, since now the operator-sdk uses kubebuilder, you can read more [here](https://github.com/operator-framework/operator-sdk/issues/3558#issuecomment-664206538).

The source for this article is [here](https://github.com/kainlite/kubernetes-prefetch-operator/)

##### **Prerequisites**
* [Operator SDK](https://sdk.operatorframework.io/docs/installation/install-operator-sdk/)
* [Go](https://golang.org/dl/)
* [Kind](https://github.com/kubernetes-sigs/kind)
* [Docker](https://hub.docker.com/?overlay=onboarding)
* [kustomize](https://github.com/kubernetes-sigs/kustomize)

#### Creating our local cluster
##### Kind config for multi-cluster
This is the kind config necessary to have a multi-node setup locally: `kind create cluster --config kind.yaml`
{{< gist kainlite 6efa9269df15fd1b7eb47c16bd568268 >}}

##### Creating the cluster
We will need a cluster to run and test our operator, so kind is pretty straight forward and lightweight enough to run anywhere.
{{< gist kainlite a15cfb1f2262f4a21f8c25d4b4e35679 >}}

#### Creating our operator
Here we bootstrap our go project aka as kubernetes operator
{{< gist kainlite 20914ab8e9b8ecdb74be9d3ad7c671d3 >}}

#### Creating our API
This will be the object that it will hold all the important information for a given image, the files that we need to modify at first hand are in: `controllers/*_controller.go` and `api/v1/*_types.go`
{{< gist kainlite 20914ab8e9b8ecdb74be9d3ad7c671d3 >}}

#### Building and pushing (docker image)
Basic build and push of the operator image with the projects helper
{{< gist kainlite c809a58f25650ca9960b1a44abd2f17b >}}

#### Deploying
Now that we have the project built into a docker image and stored in dockerhub then we can install our CRD and then deploy the operator
{{< gist kainlite fba8082e152058023fdd8141b86ad3b3 >}}

##### Deploy the operator
Then we can deploy our operator
{{< gist kainlite dbda7b13664467190c7c4d71469a824b >}}

##### Validate that our operator was deployed
Check that our pods are running
{{< gist kainlite 671d64d07acab19ff5fabeb5f1665867 >}}

So far everything is peachy but our operator is kind of useless at the moment, so let's drop some code to make it do what we want...

#### Our code
A lot of what we use is generated however we need to give it some specific permissions and behaviour to our operator so it does what we want when we create an object in kubernetes

##### Our manifest
This will be the manifest that we will be using to tell our operator which deployments we want to prefetch images for
{{< gist kainlite 483f816f36237c3e1b99f1e2391ce0f0 >}}

##### Sample nginx deployment
This nginx deployment will be used to validate that the images are fetched in all nodes
{{< gist kainlite 33387c03e2d2df059d28239f28f165d1 >}}
We don't actually need to do this, but this way it's easy to make sure that a pod won't be scheduled if the label is not present: `kubectl label nodes kind-worker3 nginx-schedulable="true"`

##### Our actual logic (this made me chuckle so much bootstrap just to get here, but imagine having to do all that by yourself)
This is where things actually happen, first we get our Spec updated:
{{< gist kainlite 52c068ebde15e585c973b9e33439f971 >}}
You can find this file [here](https://github.com/kainlite/kubernetes-prefetch-operator/blob/master/api/v1/prefetch_types.go)

Then we can put some code, I will add more comments later in the code to explain what everything does:
{{< gist kainlite 3f9ed270890b26c5e9d4b8b4d527cc45 >}}
Basically what we do is set a timer to create a pod in each node to force it fetch the image that the deployments (that we filter by labels) needs or is going to use, by doing this if the node already has the image nothing happens and it will be removed in the next run, however if the image is not there it will be fetched so if anything happens and a pod needs to be actually scheduled there it won't need to download everything so it should be relatively faster.
You can find this file [here](https://github.com/kainlite/kubernetes-prefetch-operator/blob/master/controllers/prefetch_controller.go)

##### What we should be seeing in our cluster
{{< gist kainlite b4dcc0f43758e47544fc072844ae491e >}}

#### Cleaning up
To clean up the operator from the cluster you can do, and also remember to clean up your clusters or whatever you are using if it's in the cloud to avoid unexpected bills
{{< gist kainlite 1ca0940c3b8e775db3d083bd1c7d4d42 >}}

##### **Closing notes**
Be sure to check the links if you want to learn more about the project and I hope you enjoyed it, see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

* https://sdk.operatorframework.io/docs/building-operators/golang/tutorial/
* https://sdk.operatorframework.io/docs/building-operators/golang/operator-scope/
* https://opensource.com/article/20/3/kubernetes-operator-sdk

The source for this article is [here](https://github.com/kainlite/kubernetes-prefetch-operator/)

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
