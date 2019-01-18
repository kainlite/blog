---
author: "Gabriel Garrido"
date: 2019-01-06
linktitle: Why do I need a service mesh?
title: Why do I need a service mesh?
highlight: true
tags:
- istio
- service-mesh
- kubernetes
categories:
- service-mesh
- kubernetes
---


### Introduction
This time we will see how to get started with [Istio](https://istio.io/) and why do we need to use a service mesh.

In this example I will be using [Digital Ocean](https://m.do.co/c/01d040b789de) (that's my referral link), note that I do not have any association with Digital Ocean but they give you $100 to test their products for 60 days, if you spend $25 I get another $25.

### Istio
So... You might be wondering some of those questions: why Istio? Why do I need a service mesh?, when do I need that? And I want to help you with some answers:

Why do I need a service mesh? Basically because in cloud environments you cannot trust that the network will be reliable 100% of the time, that the latency will be low, that the network is secure and the bandwidth is infinite, the service mesh is just an extra layer to help microservices communicate with each other safely and reliably.

When do I need to have one? This one can be tricky and will depend on your environment, but the moment that you start experiencing network issues between your microservices would be a good moment to do it, it could be done before of course, but it will highly depend on the project, if you can start early with it the better and easier to implement will be, always have in mind the benefits of added security, observability and likely performance improvement.

Why Istio? This will be a small series of service meshes for kubernetes and I decided to start with Istio.

In case you don't agree with my explanations that's ok, this is a TL;DR version and also I simplified things a lot, for a more complete overview you can check [this](https://blog.buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/) article or [this one](https://www.oreilly.com/ideas/do-you-need-a-service-mesh).

### Let's get started
First of all we need to download and install Istio in our cluster, the recommended way of doing it is using helm (In this case I will be using the no Tiller alternative, but it could be done with helm install as well, check here for [more info](https://istio.io/docs/setup/kubernetes/helm-install/)):
{{< highlight bash >}}
$ curl -L https://git.io/getLatestIstio | sh -
{{< /highlight >}}
This will download and extract the latest release, in this case 1.0.5 at this moment.

So let's install Istio... only pay attention to the first 3 commands, then you can skip until the end of the code block, I post all the output because I like full examples :)
{{< highlight bash >}}
istio-1.0.5 $ helm template install/kubernetes/helm/istio --name istio --namespace istio-system --set grafana.enabled=true > $HOME/istio.yaml
istio-1.0.5 $ kubectl create namespace istio-system
namespace "istio-system" created

istio-1.0.5 $ kubectl apply -f $HOME/istio.yaml
configmap "istio-galley-configuration" created
configmap "istio-statsd-prom-bridge" created
configmap "prometheus" created
configmap "istio-security-custom-resources" created
configmap "istio" created
configmap "istio-sidecar-injector" created
serviceaccount "istio-galley-service-account" created
serviceaccount "istio-egressgateway-service-account" created
serviceaccount "istio-ingressgateway-service-account" created
serviceaccount "istio-mixer-service-account" created
serviceaccount "istio-pilot-service-account" created
serviceaccount "prometheus" created
serviceaccount "istio-cleanup-secrets-service-account" created
clusterrole.rbac.authorization.k8s.io "istio-cleanup-secrets-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-cleanup-secrets-istio-system" created
job.batch "istio-cleanup-secrets" created
serviceaccount "istio-security-post-install-account" created
clusterrole.rbac.authorization.k8s.io "istio-security-post-install-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-security-post-install-role-binding-istio-system" created
job.batch "istio-security-post-install" created
serviceaccount "istio-citadel-service-account" created
serviceaccount "istio-sidecar-injector-service-account" created
customresourcedefinition.apiextensions.k8s.io "virtualservices.networking.istio.io" created
customresourcedefinition.apiextensions.k8s.io "destinationrules.networking.istio.io" created
customresourcedefinition.apiextensions.k8s.io "serviceentries.networking.istio.io" created
customresourcedefinition.apiextensions.k8s.io "gateways.networking.istio.io" created
customresourcedefinition.apiextensions.k8s.io "envoyfilters.networking.istio.io" created
customresourcedefinition.apiextensions.k8s.io "httpapispecbindings.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "httpapispecs.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "quotaspecbindings.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "quotaspecs.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "rules.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "attributemanifests.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "bypasses.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "circonuses.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "deniers.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "fluentds.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "kubernetesenvs.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "listcheckers.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "memquotas.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "noops.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "opas.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "prometheuses.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "rbacs.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "redisquotas.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "servicecontrols.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "signalfxs.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "solarwindses.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "stackdrivers.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "statsds.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "stdios.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "apikeys.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "authorizations.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "checknothings.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "kuberneteses.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "listentries.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "logentries.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "edges.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "metrics.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "quotas.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "reportnothings.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "servicecontrolreports.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "tracespans.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "rbacconfigs.rbac.istio.io" created
customresourcedefinition.apiextensions.k8s.io "serviceroles.rbac.istio.io" created
customresourcedefinition.apiextensions.k8s.io "servicerolebindings.rbac.istio.io" created
customresourcedefinition.apiextensions.k8s.io "adapters.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "instances.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "templates.config.istio.io" created
customresourcedefinition.apiextensions.k8s.io "handlers.config.istio.io" created
clusterrole.rbac.authorization.k8s.io "istio-galley-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-egressgateway-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-ingressgateway-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-mixer-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-pilot-istio-system" created
clusterrole.rbac.authorization.k8s.io "prometheus-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-citadel-istio-system" created
clusterrole.rbac.authorization.k8s.io "istio-sidecar-injector-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-galley-admin-role-binding-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-egressgateway-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-ingressgateway-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-mixer-admin-role-binding-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-pilot-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "prometheus-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-citadel-istio-system" created
clusterrolebinding.rbac.authorization.k8s.io "istio-sidecar-injector-admin-role-binding-istio-system" created
service "istio-galley" created
service "istio-egressgateway" created
service "istio-ingressgateway" created
service "istio-policy" created
service "istio-telemetry" created
service "istio-pilot" created
service "prometheus" created
service "istio-citadel" created
service "istio-sidecar-injector" created
deployment.extensions "istio-galley" created
deployment.extensions "istio-egressgateway" created
deployment.extensions "istio-ingressgateway" created
deployment.extensions "istio-policy" created
deployment.extensions "istio-telemetry" created
deployment.extensions "istio-pilot" created
deployment.extensions "prometheus" created
deployment.extensions "istio-citadel" created
deployment.extensions "istio-sidecar-injector" created
gateway.networking.istio.io "istio-autogenerated-k8s-ingress" created
horizontalpodautoscaler.autoscaling "istio-egressgateway" created
horizontalpodautoscaler.autoscaling "istio-ingressgateway" created
horizontalpodautoscaler.autoscaling "istio-policy" created
horizontalpodautoscaler.autoscaling "istio-telemetry" created
horizontalpodautoscaler.autoscaling "istio-pilot" created
mutatingwebhookconfiguration.admissionregistration.k8s.io "istio-sidecar-injector" created
attributemanifest.config.istio.io "istioproxy" created
attributemanifest.config.istio.io "kubernetes" created
stdio.config.istio.io "handler" created
logentry.config.istio.io "accesslog" created
logentry.config.istio.io "tcpaccesslog" created
rule.config.istio.io "stdio" created
rule.config.istio.io "stdiotcp" created
metric.config.istio.io "requestcount" created
metric.config.istio.io "requestduration" created
metric.config.istio.io "requestsize" created
metric.config.istio.io "responsesize" created
metric.config.istio.io "tcpbytesent" created
metric.config.istio.io "tcpbytereceived" created
prometheus.config.istio.io "handler" created
rule.config.istio.io "promhttp" created
rule.config.istio.io "promtcp" created
kubernetesenv.config.istio.io "handler" created
rule.config.istio.io "kubeattrgenrulerule" created
rule.config.istio.io "tcpkubeattrgenrulerule" created
kubernetes.config.istio.io "attributes" created
destinationrule.networking.istio.io "istio-policy" created
destinationrule.networking.istio.io "istio-telemetry" created
{{< /highlight >}}
WOAH, What did just happen?, a lot of new resources were created, basically we just generated the manifest from the helm chart and applied that to our cluster.

So lets see what's running and what that means:
{{< highlight bash >}}
$ kubectl get pods -n istio-system
NAME                                      READY     STATUS      RESTARTS   AGE
istio-citadel-856f994c58-l96p8            1/1       Running     0          3m
istio-cleanup-secrets-xqqj4               0/1       Completed   0          3m
istio-egressgateway-5649fcf57-7zwkh       1/1       Running     0          3m
istio-galley-7665f65c9c-tzn7d             1/1       Running     0          3m
istio-ingressgateway-6755b9bbf6-bh84r     1/1       Running     0          3m
istio-pilot-56855d999b-c4cp5              2/2       Running     0          3m
istio-policy-6fcb6d655f-9544z             2/2       Running     0          3m
istio-sidecar-injector-768c79f7bf-th8zh   1/1       Running     0          3m
istio-telemetry-664d896cf5-jdcwv          2/2       Running     0          3m
prometheus-76b7745b64-f8jxn               1/1       Running     0          3m
{{< /highlight >}}
A few minutes later, almost everything is up, but what's all that? Istio has several components, see the following overview extracted from [github](https://github.com/istio/istio).

**Envoy**: Sidecar proxies per microservice to handle ingress/egress traffic between services in the cluster and from a service to external services. The proxies form a secure microservice mesh providing a rich set of functions like discovery, rich layer-7 routing, circuit breakers, policy enforcement and telemetry recording/reporting functions.
Note: The service mesh is not an overlay network. It simplifies and enhances how microservices in an application talk to each other over the network provided by the underlying platform.

**Mixer**: Central component that is leveraged by the proxies and microservices to enforce policies such as authorization, rate limits, quotas, authentication, request tracing and telemetry collection.

**Pilot**: A component responsible for configuring the proxies at runtime.

**Citadel**: A centralized component responsible for certificate issuance and rotation.

**Node Agent**: A per-node component responsible for certificate issuance and rotation.

**Galley**: Central component for validating, ingesting, aggregating, transforming and distributing config within Istio.

Ok so, a lot of new things were installed but how do I know it's working? let's deploy a [test application](https://istio.io/docs/examples/bookinfo/) and check it:
{{< highlight bash >}}
$ export PATH="$PATH:~/istio-1.0.5/bin"
istio-1.0.5/samples/bookinfo $ kubectl apply -f <(istioctl kube-inject -f platform/kube/bookinfo.yaml)
service "details" created
deployment.extensions "details-v1" created
service "ratings" created
deployment.extensions "ratings-v1" created
service "reviews" created
deployment.extensions "reviews-v1" created
deployment.extensions "reviews-v2" created
deployment.extensions "reviews-v3" created
service "productpage" created
deployment.extensions "productpage-v1" created
{{< /highlight >}}
That command not only deployed the application but injected the Istio sidecar to each pod:
{{< highlight bash >}}
$ kubectl get pods
NAME                              READY     STATUS    RESTARTS   AGE
details-v1-8bd954dbb-zhrqq        2/2       Running   0          2m
productpage-v1-849c786f96-kpfx9   2/2       Running   0          2m
ratings-v1-68d648d6fd-w68qb       2/2       Running   0          2m
reviews-v1-b4c984bdc-9s6j5        2/2       Running   0          2m
reviews-v2-575446d5db-r6kwc       2/2       Running   0          2m
reviews-v3-74458c4889-kr4wb       2/2       Running   0          2m
{{< /highlight >}}
As we can see each pod has 2 containers in it, the app container and istio-proxy. You can also configure [automatic sidecar injection](https://istio.io/docs/setup/kubernetes/sidecar-injection/#automatic-sidecar-injection).

Also all services are running:
{{< highlight bash >}}
$ kubectl get services
NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
details       ClusterIP   10.245.134.179   <none>        9080/TCP   3m
kubernetes    ClusterIP   10.245.0.1       <none>        443/TCP    3d
productpage   ClusterIP   10.245.32.221    <none>        9080/TCP   3m
ratings       ClusterIP   10.245.159.112   <none>        9080/TCP   3m
reviews       ClusterIP   10.245.77.125    <none>        9080/TCP   3m
{{< /highlight >}}

But how do I access the app?
{{< highlight bash >}}
istio-1.0.5/samples/bookinfo $ kubectl apply -f networking/bookinfo-gateway.yaml
gateway.networking.istio.io "bookinfo-gateway" created
virtualservice.networking.istio.io "bookinfo" created
{{< /highlight >}}
In Istio a Gateway configures a load balancer for HTTP/TCP traffic, most commonly operating at the edge of the mesh to enable ingress traffic for an application (L4-L6).

After that we need to set some environment variables to fetch the LB ip, port, etc.
{{< highlight bash >}}
$ export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
$ export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
$ export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].port}')
$ export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT

curl -o /dev/null -s -w "%{http_code}\n" http://${GATEWAY_URL}/productpage
{{< /highlight >}}
If the latest curl returns 200 then we're good, you can also browse the app `open http://${GATEWAY_URL}/productpage` and you will see something like the following image:
{{< figure src="/img/productpage-example.png" title="Product page example" width="100%" >}}

Also you can use [Grafana](https://grafana.com/) to check some metrics about the service usage, etc. (You don't have to worry about prometheus since it's enabled by default). Spin up the port-forward so we don't have to expose grafana: to the world with: `kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000`, and then `open http://localhost:3000`.

As a general advice check all the settings that Istio offers try the ones that you think that could be useful for your project and always measure and compare.

### Notes
* Do mind that **pilot** pod requires at least 4 Gbs of memory, so you will need at least one node with that amount of memory.
* You can check the load balancer status under: Manage -> Networking -> Load balancers. And if everything is okay your LB will say Healthy.
* Grafana is not enabled by default but we do enable it via helm with `--set grafana.enabled=true`, if you want to check all the possible options [go here](https://istio.io/docs/reference/config/installation-options/), if you are using more than two `--set` options I would recommend creating a `values.yaml` file and use that instead.
* Istio is a big beast and should be treated carefully, there is a lot more to learn and test out. We only scratched the surface here.

### Upcoming posts
* More examples using Istio.
* Linkerd.
* Maybe some Golang fun.
* Serverless or kubeless, that's the question.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
