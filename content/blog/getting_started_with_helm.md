---
author: "Gabriel Garrido"
date: 2018-12-23
linktitle: Getting started with Helm
title: Getting started with Helm
highlight: true
---

### **Introduction**

This tutorial will show you how to create a simple chart and also how to deploy it to kubernetes using Helm, in the examples I will be using [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube) or you can check this repo that has a good overview of [minikube](https://github.com/dysinger/learn-minikube), once installed and started (`minikube start`) that command will download and configure the local environment, you can follow with the following example:

Create the chart:
```
helm create hello-world
```
Always use valid DNS names if you are going to have services, otherwise you will have issues later on.

Inspect the contents:
```
cd hello-world

charts       <--- Dependencies, charts that your chart depends on.
Chart.yaml   <--- Metadata mostly, defines the version of your chart, etc.
templates    <--- Here is where the magic happens.
values.yaml  <--- Default values file (this is used to replace in the templates at runtime)
```

The file `values.yaml` by default will look like the following snippet:
```
replicaCount: 1

image:
  repository: nginx
  tag: stable
  pullPolicy: IfNotPresent

nameOverride: ""
fullnameOverride: ""

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  annotations: {}
    # kubernetes.io/ingress.class: nginx
    # kubernetes.io/tls-acme: "true"
  path: /
  hosts:
    - chart-example.local
  tls: []
  #  - secretName: chart-example-tls
  #    hosts:
  #      - chart-example.local

resources: {}
nodeSelector: {}
tolerations: []
affinity: {}
```

The next step would be to check the `templates` folder:
```
deployment.yaml  <--- Standard kubernetes deployment with go templates variables.
_helpers.tpl     <--- This file defines some common variables.
ingress.yaml     <--- Ingress route, etc.
NOTES.txt        <--- Once deployed this file will display the details of our deployment, usually login data, how to connect, etc.
service.yaml     <--- The service that we will use internally and/or via ingress to reach our deployed service.
```
Go [templates](https://blog.gopheracademy.com/advent-2017/using-go-templates/) basics, if you need a refresher or a crash course in go templates.

Let's check the deployment file:
```
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: {{ include "hello-world.fullname" . }}
  labels:
    app.kubernetes.io/name: {{ include "hello-world.name" . }}
    helm.sh/chart: {{ include "hello-world.chart" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: {{ .Release.Service }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "hello-world.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ include "hello-world.name" . }}
        app.kubernetes.io/instance: {{ .Release.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 80
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /
              port: http
          readinessProbe:
            httpGet:
              path: /
              port: http
          resources:
{{ toYaml .Values.resources | indent 12 }}
    {{- with .Values.nodeSelector }}
      nodeSelector:
{{ toYaml . | indent 8 }}
    {{- end }}
    {{- with .Values.affinity }}
      affinity:
{{ toYaml . | indent 8 }}
    {{- end }}
    {{- with .Values.tolerations }}
      tolerations:
{{ toYaml . | indent 8 }}
    {{- end }}
```
As you can see everything will get replaced by what you define in the `values.yaml` file and everything is under `.Values` unless you define a local variable or some other variable using helpers for example.

Let's check the service file:
```
apiVersion: v1
kind: Service
metadata:
  name: {{ include "hello-world.fullname" . }}
  labels:
    app.kubernetes.io/name: {{ include "hello-world.name" . }}
    helm.sh/chart: {{ include "hello-world.chart" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: {{ .Release.Service }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/name: {{ include "hello-world.name" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
```

Let's check the ingress file:
```
{{- if .Values.ingress.enabled -}}
{{- $fullName := include "hello-world.fullname" . -}}
{{- $ingressPath := .Values.ingress.path -}}
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: {{ $fullName }}
  labels:
    app.kubernetes.io/name: {{ include "hello-world.name" . }}
    helm.sh/chart: {{ include "hello-world.chart" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.ingress.annotations }}
  annotations:
{{ toYaml . | indent 4 }}
{{- end }}
spec:
{{- if .Values.ingress.tls }}
  tls:
  {{- range .Values.ingress.tls }}
    - hosts:
      {{- range .hosts }}
        - {{ . | quote }}
      {{- end }}
      secretName: {{ .secretName }}
  {{- end }}
{{- end }}
  rules:
  {{- range .Values.ingress.hosts }}
    - host: {{ . | quote }}
      http:
        paths:
          - path: {{ $ingressPath }}
            backend:
              serviceName: {{ $fullName }}
              servicePort: http
  {{- end }}
{{- end }}
```
The ingress file is one of the most interesting ones in my humble opinion because it has a if else example and also local variables (`$fullName` for example), also iterates over a possible slice of dns record names (hosts), and the same if you have certs for them (a good way to get let's encrypt certificates automatically is using cert-manager, in the next post I will expand on this example adding a basic web app with mysql and ssl/tls).

After checking that everything is up to our needs the only thing missing is to finally deploy it to kubernetes (But first let's install tiller):
```
$ helm init
$HELM_HOME has been configured at /home/gabriel/.helm.

Tiller (the Helm server-side component) has been installed into your Kubernetes Cluster.

Please note: by default, Tiller is deployed with an insecure 'allow unauthenticated users' policy.
To prevent this, run `helm init` with the --tiller-tls-verify flag.
For more information on securing your installation see: https://docs.helm.sh/using_helm/#securing-your-helm-installation
Happy Helming!
```
Note that many of the complains that Helm receives are because of the admin-y capabilities that Tiller has. A good note on the security issues that Tiller can suffer and some mitigations can be found on the [Bitnami page](https://engineering.bitnami.com/articles/helm-security.html), this mostly applies to multi-tenant clusters. And also be sure to check [Securing Helm](https://docs.helm.sh/using_helm/#securing-your-helm-installation)

Deploy our chart:
```
$ helm install --name my-nginx -f values.yaml .
NAME:   my-nginx
LAST DEPLOYED: Sun Dec 23 00:30:11 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Service
NAME                  AGE
my-nginx-hello-world  0s

==> v1beta2/Deployment
my-nginx-hello-world  0s

==> v1/Pod(related)

NAME                                   READY  STATUS   RESTARTS  AGE
my-nginx-hello-world-6f948db8d5-s76zl  0/1    Pending  0         0s

NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=hello-world,app.kubernetes.io/instance=my-nginx" -o jsonpath="{.items[0].metadata.name}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl port-forward $POD_NAME 8080:80
```
Our deployment was successful and we can see that our pod is waiting to be scheduled.

Let's check that our service is there:
```
$ kubectl get services
NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes             ClusterIP   10.96.0.1       <none>        443/TCP   1h
my-nginx-hello-world   ClusterIP   10.111.222.70   <none>        80/TCP    5m
```

And now we can test that everything is okay by running another pod in interactive mode, for example:
```
$ kubectl run -i --tty alpine --image=alpine -- sh
If you don't see a command prompt, try pressing enter.

/ # apk add curl
fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/community/x86_64/APKINDEX.tar.gz
(1/5) Installing ca-certificates (20171114-r3)
(2/5) Installing nghttp2-libs (1.32.0-r0)
(3/5) Installing libssh2 (1.8.0-r3)
(4/5) Installing libcurl (7.61.1-r1)
(5/5) Installing curl (7.61.1-r1)
Executing busybox-1.28.4-r2.trigger
Executing ca-certificates-20171114-r3.trigger
OK: 6 MiB in 18 packages

/ # curl -v my-nginx-hello-world
* Rebuilt URL to: my-nginx-hello-world/
*   Trying 10.111.222.70...
* TCP_NODELAY set
* Connected to my-nginx-hello-world (10.111.222.70) port 80 (#0)
> GET / HTTP/1.1
> Host: my-nginx-hello-world
> User-Agent: curl/7.61.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.14.2
< Date: Sun, 23 Dec 2018 03:45:31 GMT
< Content-Type: text/html
< Content-Length: 612
< Last-Modified: Tue, 04 Dec 2018 14:44:49 GMT
< Connection: keep-alive
< ETag: "5c0692e1-264"
< Accept-Ranges: bytes
<
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
* Connection #0 to host my-nginx-hello-world left intact
```
And voila we see our nginx deployed there and accesible via service name to our other pods (this is fantastic for microservices).

Our current deployment can be checked like this:
```
$ helm ls
NAME            REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
my-nginx        1               Sun Dec 23 00:30:11 2018        DEPLOYED        hello-world-0.1.0       1.0             default
```

The last example would be to upgrade our deployment, lets change the `tag` in the `values.yaml` file from `stable` to `mainline` and update also the metadata file (`Chart.yaml`) to let Helm know that this is a new version of our chart.
```
 $ helm upgrade my-nginx . -f values.yaml
Release "my-nginx" has been upgraded. Happy Helming!
LAST DEPLOYED: Sun Dec 23 00:55:22 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Pod(related)
NAME                                   READY  STATUS             RESTARTS  AGE
my-nginx-hello-world-6f948db8d5-s76zl  1/1    Running            0         25m
my-nginx-hello-world-c5cdcc95c-shgc6   0/1    ContainerCreating  0         0s

==> v1/Service

NAME                  AGE
my-nginx-hello-world  25m

==> v1beta2/Deployment
my-nginx-hello-world  25m


NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=hello-world,app.kubernetes.io/instance=my-nginx" -o jsonpath="{.items[0].metadata.name}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl port-forward $POD_NAME 8080:80
```
Note that I always specify the -f values.yaml just for explicitness.

It seems that our upgrade went well, let's see what Helm sees
```
$ helm ls
NAME            REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
my-nginx        2               Sun Dec 23 00:55:22 2018        DEPLOYED        hello-world-0.1.1       1.0             default
```

But before we go let's validate that it did deployed the nginx version that we wanted to have:
```
$ kubectl exec my-nginx-hello-world-c5cdcc95c-shgc6 -- /usr/sbin/nginx -v
nginx version: nginx/1.15.7
```
At the moment of this writing mainline is 1.15.7, we could rollback to the previous version by doing:
```
$ helm rollback my-nginx 1
Rollback was a success! Happy Helming!
```
Basically this command needs a deployment name `my-nginx` and the revision number to rollback to in this case `1`.

Let's check the versions again:
```
$ kubectl exec my-nginx-hello-world-6f948db8d5-bsml2 -- /usr/sbin/nginx -v
nginx version: nginx/1.14.2
```

Let's clean up:
```
$ helm del --purge my-nginx
release "my-nginx" deleted
```

If you need to see what will be sent to the kubernetes API then you can use the following command (sometimes it's really useful for debugging or to inject a sidecar using pipes):
```
$ helm template . -name my-nginx -f values.yaml
# Source: hello-world/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ame-hello-world
```

And that folks is all I have for now, be sure to check own [Helm Documentation](https://docs.helm.sh/) and `helm help` to know more about what helm can do to help you deploy your applications to any kubernetes cluster.

### Don't Repeat Yourself
DRY is a good design goal and part of the art of a good template is knowing when to add a new template and when to update an existing one. While you're figuring that out, accept that you'll be doing some refactoring. Helm and go makes that easy and fast.

### Upcoming topics
The following posts will be about package managers, development deployment tools, etc. It's hard to put all the tools in a category, but they are trying to solve similar problems in different ways, and we will be exploring the ones that seem more promising to me, if you would like me to cover any other tool/project/whatever, just send me a message :)

* Build on the first basic example and host a basic web app with storage and tls certificates.
* Getting started with Ksonnet and friends.
* Getting started with Skaffold.
* Getting started with Gitkube.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.
