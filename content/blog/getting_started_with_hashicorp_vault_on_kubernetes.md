---
author: "Gabriel Garrido"
date: 2019-04-21
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
lua:
  image:
    url: "/img/vault.png"
---

##### **Introduction**
Vault secures, stores, and tightly controls access to tokens, passwords, certificates, API keys, and other secrets in modern computing. What this means is that you can safely store all your App secrets in Vault without having to worry anymore how to store, provide, and use those secrets, we will see how to install it on a running kubernetes cluster and save and read a secret by our application, in this page we will be using Vault version 1.1.1, we will be using dynamic secrets, that means that each pod will have a different secret and that secret will expire once the pod is killed.

##### **The command**
First of all we will need to install our Vault server in our cluster, you can use the following podspec to deploy it to your cluster, just adjust the amount of replicas.
{{< gist kainlite  >}}

Then in order to interact with our new vault server just download the same binary version from [Vault Downloads](https://www.vaultproject.io/downloads.html), unzip and move the binary to an executable path, for example: `/usr/local/bin/`, then let's just create a sample secret that later we will provide to our App.
{{< gist kainlite  >}}

##### **The parameters and their meaning**
{{< gist kainlite  >}}

##### **Server configuration**

##### **AllowTcpForwarding**

##### **Closing notes**

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
