---
author: "Gabriel Garrido"
date: 2020-11-29
linktitle: Kubernetes authentication and authorization
title: Kubernetes authentication and authorization
highlight: true
tags:
- kubernetes
- linux
- security
categories:
- kubernetes
images:
  - "/img/kubernetes.png"
---

#### Introduction
In this article we will explore how authentication and authorization works in kubernetes. But first what's the difference?

**Authentication**:

When you validate your identity against a service or system you are authenticated meaning that the system recognizes you as a valid user. In kubernetes when you are creating the clusters you basically create a CA (Certificate Authority) that then you use to generate certificates for all components and users.

**Authorization**:

After you are authenticated the system needs to know if you have enough privileges to do whatever you might want to do. In kubernetes this is known as RBAC (Role based access control) and it translates to Roles as entities with permissions and are associated to service accounts via role bindings when things are scoped to a given namespace, otherwise you can have a cluster role and cluster role binding.

So we are going to create a namespace, a serviceaccount, a role and a role binding and then generate a kubeconfig for it and then test it.

The sources for this article can be found at: [RBAC Example](https://github.com/kainlite/rbac-example)

#### Let's get to it
Let's start, I will use these generators but I'm saving these to a file and then applying.

**Namespace**:

The namespace resource is like a container for other resources and it's often useful when deploying many apps to the same cluster or there are multiple users:
{{< gist kainlite 828785468668500a414d944ad88916e1 >}}

You can see more [here](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

**Service account**:

The service account is your identity as part of the system, there are some important distinctions in user accounts vs service accounts, for example:
* User accounts are for humans. Service accounts are for processes, which run in pods.
* User accounts are intended to be global. Names must be unique across all namespaces of a cluster. Service accounts are namespaced.
For this example we are generating a serviceaccount for a pod and a user account for us to use with kubectl (if we wanted a global user we should have used clusterrole and clusterrolebinding).
{{< gist kainlite de549aad7fd64ab9ee0ecc23fd2e8cf9 >}}

You can see more [here](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)

**Role**:

This role has admin-like privileges, the allowed verbs are, we are using \* which means all:
* list
* get
* watch
* create
* patch
* update
* delete
{{< gist kainlite 2e0bf3309f59e4ccccd8293f24792fcd >}}

You can see more [here](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#determine-the-request-verb)
and [here](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#clusterrole-example)

**Role binding**:

This is the glue that gives the permissions in the role to the service account that we created.
{{< gist kainlite 1662dc711fca25f786868baabb1ae0c4 >}}

You can see more [here](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#clusterrolebinding-example)

**Example pod**

Here we create a sample pod with curl and give it the service account with `--serviceaccount=`
{{< gist kainlite 888e39b3c16c17f6a0ae7eeee9fe7329 >}}

**Applying**

Here we create all resources
{{< gist kainlite 9e6cbc9a5913cda59e9fc79445c40969 >}}

**Validating from the pod**

Here we will export the token for our service account and query the kubernetes API.
{{< gist kainlite b881d73776369645c03aa0863fe79d17 >}}
Notice that to be able to reach the kubernetes service since it's in a different namespace we need to specify it with `.default` (because it's in the default namespace) try: `kubectl get svc -A` to see all services.

Everything went well from our pod and we can communicate to the API from our pod, let's see if it works for kubectl as well.

**Generate kubectl config**

Fetch the token (as you can see it's saved as a kubernetes secret, so it's mounted to pods as any other secret but automatically thanks to the service account)
{{< gist kainlite 6c0956e49301b938f6e29cf9b31dbb10 >}}
Notes: I used `kubectl config view` to discover the kind endpoint which is `server: https://127.0.0.1:35617` in my case, then replaced the values from the secret for the CA and the service account token/secret, also note that you need to decode from base64 when using `kubectl get -o yaml`, also note that we will get errors when trying to do things outside of our namespace because we simply don't have permissions, this is a really powerful way to give permissions to users and this works because we created the role binding for our extra user and for the pod service account (be careful when wiring things up).

You can see more [here](http://docs.shippable.com/deploy/tutorial/create-kubeconfig-for-self-hosted-kubernetes-cluster/)
and [here](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)

#### Clean up
Always remember to clean up your local machine / cluster / etc, in my case `kind delete cluster` will do it.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
