---
author: "Gabriel Garrido"
date: 2020-11-27
linktitle: Kubernetes local playground alternatives
title: Kubernetes local playground alternatives
highlight: true
tags:
- kubernetes
- vagrant
- linux
categories:
- kubernetes
images:
  - "/img/kubernetes.jpg"
---

##### **Introduction**
In this article we will explore different alternatives for spinning up a cluster locally for testing, practicing or just developing an application.

The source code and/or documentation of the projects that we will be testing are listed here:
* [minikube](https://minikube.sigs.k8s.io/docs/start/)
* [kind](https://kind.sigs.k8s.io/docs/user/quick-start/)
* [Kubernetes the hard way using vagrant](https://github.com/kainlite/kubernetes-the-easy-way-with-vagrant)
* [Kubernetes with kubeadm using vagrant](https://github.com/kainlite/kubernetes-the-easy-way-with-vagrant-and-kubeadm)

There are more alternatives like [Microk8s](https://microk8s.io/) but I will leave that as an exercise for the reader.

If you want to give it a try to each one make sure to follow their recommended way of install or your distro/system way.

The first two (minikube and kind) we will see how to configure a CNI plugin in order to be able to use [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/), in the other two environments you can customize everything and these are best for learning rather than for daily usage but if you have enough ram you could do that as well.

We will be using the following pods and network policy to test that it works, we will create 3 pods, 1 client and 2 app backends, one backend will be listening in port TCP/1111 and the other in the port TCP/2222, in our netpolicy we will only allow our client to connect to app1:
{{< gist kainlite 296e4987866f383d7cc64a70ee92cea9 >}}

If you want to learn more about netcat and friends go to: [Cat and friends: netcat and socat](https://techsquad.rocks/blog/cat_and_friends_netcat_socat/)

##### Minikube
Minikube is heavily used but it can be too heavy sometimes, in any case we will see an example of making it work with network policies, the good thing is that it has a lot of documentation because a lot of people use it and it is updated often:
{{< gist kainlite 15e74a5f662d182a03b1b4c449ebc0ef >}}

###### Give it a couple of minutes to start, for new versions of minikube you can install it like this, otherwise you can specify that you will install the CNI plugin and then just install the manifests.
{{< gist kainlite a9f0f1cd7a62438e0f0272c73e68f2d3 >}}

###### Then let's validate that it works
{{< gist kainlite  56d4c6dfc868e59d592ab8814df80247 >}}
Note that we add the timeout command with 5 seconds wait so we don't have to really wait for nc timeout which by default is no timeout, we also tested with nc timeout.

You can get more info for minikube using Cilium on their [docs](https://docs.cilium.io/en/v1.9/gettingstarted/minikube/)

###### Remember to clean up
{{< gist kainlite 1122ca58d12e56bc7b411df4a817a687 >}}

##### KIND
KIND is really lightweight and fast, I usually test and develop using KIND the main reason is that almost everything works like in a real cluster but it has no overhead, it's simple to install and easy to run, first we need to put this config in place to tell kind not to use it's default CNI.
{{< gist kainlite 5970458ddef9722e28a4ab195a3fbe44 >}}

Then we can create the cluster and install calico (there is a small gotcha here, you need to check that the calico node pods come up if not kill them and they should come up and everything will start working normally, this is due to the environment variable that gets added after the deployment for it to work with KIND):
{{< gist kainlite fb1b68aa8ecbf7d5d1f6a8290693fabc >}}

You can check for more config options for KIND [here](https://kind.sigs.k8s.io/docs/user/configuration/#networking)

###### Validation
{{< gist kainlite 881e08f6d86fccfc19c90f137d141d1a >}}

###### Testing again:
{{< gist kainlite 723c34e69d516d92a2dc8a2fb36eba94 >}}

##### Kubeadm and vagrant
This is an interesting scenario and it's great to understand how clusters are configured using kubeadm also to practice things such as adding/removing/upgrading the nodes, backup and restore etcd, etc. if you want to test this one clone this repo: [Kubernetes with kubeadm using vagrant](https://github.com/kainlite/kubernetes-the-easy-way-with-vagrant-and-kubeadm)
{{< gist kainlite  4c220572ef64fc5632eaca9dd61274d6 >}}

###### Next, lets copy the kubeconfig and deploy our resources then test (this deployment is using weave)
{{< gist kainlite c0b82abded8570313e880cbc53d7307f >}}

###### Test it (wait until the pods are in ready state)
{{< gist kainlite d0c52595f9e1fe390bcc67674c752449 >}}

###### For more info refer to the readme in the repo and the scripts in there, it should be straight forward to follow and reproduce, remember to clean up:
{{< gist kainlite d56933b3f8f625dce31ee3009544137b >}}

##### Kubernetes the hard way and vagrant
This is probably the most complex scenario and it's purely educational you get to generate all the certificates by hand basically and configure everything by yourself (see the original repo for instructions in how to do that in gcloud if you are interested), if you want to test this one clone this repo: [Kubernetes the hard way using vagrant](https://github.com/kainlite/kubernetes-the-easy-way-with-vagrant), but be patient and ready to debug if something doesn't go well.
{{< gist kainlite ad908b7a3ba2ac7b62847547e6543cda >}}

###### Validation:
{{< gist kainlite ecee83106224d044305f626ee594aaf6 >}}
{{< gist kainlite 411720203edc931ea3b3eed70208364a >}}


###### Install the manifests and test it:
{{< gist kainlite e4d357f4d32d4d2c4e39124e47bfa2ed >}}

###### Clean up
{{< gist kainlite b905f5a7efe4a6a86090008e89229173 >}}

##### Wrap up
Each alternative has its use case, test each one and pick the one that best fit your needs.

##### Clean up
Remember to clean up to recover some resources in your machine.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
