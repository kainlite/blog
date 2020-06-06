---
author: "Gabriel Garrido"
date: 2019-04-28
linktitle: Getting started with HashiCorp Vault on Kubernetes
title: Getting started with HashiCorp Vault on Kubernetes
highlight: true
tags:
- kubernetes
- vault
- linux
- security
categories:
- kubernetes
images:
  - "/img/vault.png"
---

##### **Introduction**
Vault secures, stores, and tightly controls access to tokens, passwords, certificates, API keys, and other secrets in modern computing. What this means is that you can safely store all your App secrets in Vault without having to worry anymore how to store, provide, and use those secrets, we will see how to install it on a running kubernetes cluster and save and read a secret by our application, in this page we will be using Vault version 1.1.1, we will be using dynamic secrets, that means that each pod will have a different secret and that secret will expire once the pod is killed.

Before you start you will need [Consul](https://www.consul.io/docs/install/index.html), [Vault](https://www.vaultproject.io/docs/install/) client binaries and [Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) or any running cluster, you can find the files used here in [this repo](https://github.com/kainlite/vault-consul-tls).

This is the part one of [two]({{< ref "/blog/actually_using_vault_on_kubernetes" >}})

##### **Preparing the cluster**
Let's start minikube and validate that we can reach our cluster with `minikube start` and then with `kubectl get nodes`, also the dashboard can become handy you can invoke it like this `minikube dashboard`
{{< gist kainlite 750ee3b20d03fe3e999844c1c80fcf3f >}}

##### **Creating certificates for Consul and Vault**
Vault needs a backend to store data, this backend can be consul, etcd, postgres, and [many more](https://www.vaultproject.io/docs/configuration/storage/index.html), so the first thing that we are going to do is create a certificate so consul and vault can speak to each other securely.
{{< gist kainlite f46c829de562750d0fb21ec25f8fa91b >}}

##### **Consul**
The next steps would be to create an encryption key for the consul cluster and to create all the kubernetes resources associated with it
{{< gist kainlite 4f787ef0e5152eb14928a73b3e2b9d91 >}}

##### **Vault**
Once we have Consul running starting vault should be straight forward, we need to create all kubernetes resources associated with it and then initialize and unseal the vault.
{{< gist kainlite dbe6cb3055b5c202bb3f65b7178e2f7c >}}

##### **Closing notes**
As you can see it takes a while to configure a Vault server but I really like the pattern that renders for the apps using it, in the next post we will see how to unlock it automatically with kubernetes and also how to mount the secrets automatically to our pods so our applications can use it :), this post was heavily inspired by [this one](https://testdriven.io/blog/running-vault-and-consul-on-kubernetes/) and [this one](https://learn.hashicorp.com/consul/advanced/day-1-operations/certificates#configuring-agents).

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
