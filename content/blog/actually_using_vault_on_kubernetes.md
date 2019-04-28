---
author: "Gabriel Garrido"
date: 2019-04-29
linktitle: Actually using Vault on Kubernetes
title: Actually using Vault on Kubernetes
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
    url: "/img/vault-kubernetes.png"
---

##### **Introduction**
In the previous article we configured Vault with Consul on our cluster, now it's time to go ahead and use it to provision secrets to our pods/applications. If you don't remember about it or don't have your Vault already configured you can go to [Getting started with HashiCorp Vault on Kubernetes]({{< ref "/blog/getting_started_with_hashicorp_vault_on_kubernetes" >}}).

In this article we will actually create an example using mutual TLS and provision some secrets to our app, You can find the files used here in [this repo](https://github.com/kainlite/vault-kubernetes).

##### **Creating a cert for our new client**
As we see here we need to enable kv version 1 on `/secret` for this to work, then we just create a secret and store it as a kubernetes secret for myapp, note that the CA was created in the previous article and we rely on these certificates so we can keep building on that.
{{< gist kainlite 2989cf05404896f7b65ac400068ac903 >}}

##### **Service account for kubernetes**
In Kubernetes, a service account provides an identity for processes that run in a Pod so that the processes can contact the API server.
{{< gist kainlite 8440fe3654d36fb2055c7ceb894f167e >}}

##### **Vault policy**
Then we need to set a read-only policy for our secrets, we don't want or app to be able to write or rewrite secrets.
{{< gist kainlite aef3234eb43aa37f7cce5f20ecf7c757 >}}

##### **Kubernetes configuration**
Set the environment variables to point to the running Minikube environment and enable the [kubernetes authentication method](https://www.vaultproject.io/docs/auth/kubernetes.html#configuration) and then validate it from a temporal Pod.
{{< gist kainlite a47d22781b177c483bfe706cc436f049 >}}

##### **The deployment and the consul-template configuration**
If you check the volume mounts and the secrets we load the certificates we created initially and use them to fetch the secret from vault
{{< gist kainlite 0cc0e90b668c2fef4d2442e1b9eed03f >}}

This is where the magic happens so we're able to fetch secrets (thanks to that role and the token that then will be stored there)
{{< gist kainlite f977a689000a20c5163ce72cea0039f5 >}}

And last but not least we create a file based in the template provided which our nginx container will render on the screen later, this is done using Consul Template.
{{< gist kainlite 3dd851d97eba8222dd978a2e7ed067a9 >}}

##### **Test it!**
The last step would be to test all that, so after having deployed the files to kubernetes we should see something like this
{{< gist kainlite 269dd3f96ef2b5505a50513eef9ff94c >}}

##### **Closing notes**
This post was heavily inspired by [this doc page](https://learn.hashicorp.com/vault/identity-access-management/vault-agent-k8s), the main difference is that we have mutual TLS on, the only thing left would be to auto unseal our Vault, but we will left that for a future article or as an exercise for the reader.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
