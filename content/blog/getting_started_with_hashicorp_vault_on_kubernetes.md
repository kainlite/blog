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
draft: true
---

##### **Introduction**
Vault secures, stores, and tightly controls access to tokens, passwords, certificates, API keys, and other secrets in modern computing. What this means is that you can safely store all your App secrets in Vault without having to worry anymore how to store, provide, and use those secrets, we will see how to install it on a running kubernetes cluster and save and read a secret by our application, in this page we will be using Vault version 1.1.1, we will be using dynamic secrets, that means that each pod will have a different secret and that secret will expire once the pod is killed.

Before you start you will need [Go](https://golang.org/doc/install), [Consul](https://www.consul.io/docs/install/index.html), [Vault](https://www.vaultproject.io/docs/install/) and [Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) or any running cluster.

##### **Preparing the cluster**
Let's start minikube and validate that we can reach our cluster with `minikube start` and then with `kubectl get nodes`, also the dashboard can become handy you can invoke it like this `minikube dashboard`
{{< gist kainlite 750ee3b20d03fe3e999844c1c80fcf3f >}}

##### **Configuring Vault**
Vault needs a backend to store data, this backend can be consul, etcd, postgres, and [many more](https://www.vaultproject.io/docs/configuration/storage/index.html), so the first thing that we are going to do is create a certificate so consul and vault can speak to each other securely.
{{< gist kainlite f1c22fae8ea806a4b11921133993c204 >}}

##### **The parameters and their meaning**
{{< gist kainlite  >}}

```
$ consul tls ca create
==> Saved consul-agent-ca.pem
==> Saved consul-agent-ca-key.pem

$ consul tls cert create -server -additional-dnsname server.dc1.cluster.local
==> WARNING: Server Certificates grants authority to become a
    server and access all state in the cluster including root keys
    and all ACL tokens. Do not distribute them to production hosts
    that are not server nodes. Store them as securely as CA keys.
==> Using consul-agent-ca.pem and consul-agent-ca-key.pem
==> Saved dc1-server-consul-0.pem
==> Saved dc1-server-consul-0-key.pem

$ consul tls cert create -client
==> Using consul-agent-ca.pem and consul-agent-ca-key.pem
==> Saved dc1-client-consul-0.pem
==> Saved dc1-client-consul-0-key.pem


# For Consul
$ export GOSSIP_ENCRYPTION_KEY=$(consul keygen)
$ kubectl create secret generic consul \
  --from-literal="gossip-encryption-key=${GOSSIP_ENCRYPTION_KEY}" \
  --from-file=certs/consul-agent-ca.pem \
  --from-file=certs/dc1-server-consul-0.pem \
  --from-file=certs/dc1-server-consul-0-key.pem

secret/consul created

# For Vault
$ kubectl create secret generic vault \
    --from-file=certs/consul-agent-ca.pem \
    --from-file=certs/dc1-client-consul-0.pem \
    --from-file=certs/dc1-client-consul-0-key.pem

secret/vault created

$ kubectl create configmap consul --from-file=consul/config.json

configmap/consul created

$ kubectl create configmap vault --from-file=vault/config.json

configmap/vault created

$ kubectl create -f consul/01-service.yaml

service/consul created

$ kubectl create -f consul/02-statefulset.yaml
statefulset.apps/consul created

$ kubectl port-forward consul-1 8500:8500

$ consul members
Node      Address          Status  Type    Build  Protocol  DC   Segment
consul-0  172.17.0.5:8301  alive   server  1.4.4  2         dc1  <all>
consul-1  172.17.0.6:8301  alive   server  1.4.4  2         dc1  <all>
consul-2  172.17.0.7:8301  alive   server  1.4.4  2         dc1  <all>
vault-1   172.17.0.8:8301  alive   client  1.4.4  2         dc1  <default>

$ kubectl create -f vault/01-service.yaml
service/vault created

$ kubectl create -f vault/02-deployment.yaml
deployment.extensions/vault created

$ kubectl port-forward vault-6d78b6df7c-z7chq 8200:8200

$ export VAULT_ADDR=https://127.0.0.1:8200
$ export VAULT_CACERT="certs/consul-agent-ca.pem"

$ vault operator init -key-shares=3 -key-threshold=3

vault operator init -key-shares=3 -key-threshold=3
Unseal Key 1: 8I3HkpLoujn+fAdXHCRJYGJEw0WpvamnzTNu5IGyTcWB
Unseal Key 2: I65GU6xRt+ZX+QigBjCHRyht8pvIOShpU5TL8iLGhr6g
Unseal Key 3: n+Kv2qrDNiIELEy3dEMfUpD/c8EtnwpJCYIn88TrS3Pg

Initial Root Token: s.3pEYBZqlzvDpImB988GyAsuf

Vault initialized with 3 key shares and a key threshold of 3. Please securely
distribute the key shares printed above. When the Vault is re-sealed,
restarted, or stopped, you must supply at least 3 of these keys to unseal it
before it can start servicing requests.

Vault does not store the generated master key. Without at least 3 key to
reconstruct the master key, Vault will remain permanently sealed!

It is possible to generate new unseal keys, provided you have a quorum of
existing unseal keys shares. See "vault operator rekey" for more information.

$ vault operator unseal # repeat with the 3 required keys
Unseal Key (will be hidden):
Key                Value
---                -----
Seal Type          shamir
Initialized        true
Sealed             true
Total Shares       3
Threshold          3
Unseal Progress    1/3
Unseal Nonce       e9bb1681-ba71-b90d-95f6-8e68389e934b
Version            1.1.1
HA Enabled         true

```

##### **Server configuration**

##### **AllowTcpForwarding**

##### **Closing notes**

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
