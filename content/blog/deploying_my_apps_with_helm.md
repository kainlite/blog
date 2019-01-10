---
author: "Gabriel Garrido"
date: 2018-12-24
linktitle: Deploying my apps with Helm
title: Deploying my apps with Helm
highlight: true
tags:
- helm
- deployment_tools
- kubernetes
categories:
- deployment_tools
---

### **Deploying my apps with Helm**

If you are already familiar with [Helm](https://helm.sh/), and the different types of kubernetes workloads / resource types you might be wondering how to install apps directly to kubernetes, yes, you don't have to re-invent the wheel for your mysql installation, or your postgres, or nginx, jenkins, You name it. Helm solves that problem with [Charts](https://github.com/helm/charts), this list has the official charts maintained by the community, where the folder incubator may refer to charts that are still not compliant with the [technical requirements](https://github.com/helm/charts/blob/master/CONTRIBUTING.md#technical-requirements) but probably usable and the folder stable is for _graduated_ charts. This is not the only source of charts as you can imagine, You can use any source for your charts, even just the [tgz](https://docs.helm.sh/using_helm/#helm-install-installing-a-package) files, as we will see in this post.

How do I search for charts?:
```bash
$ helm search wordpress
NAME                    CHART VERSION   APP VERSION     DESCRIPTION
stable/wordpress        3.3.0           4.9.8           Web publishing platform for building blogs and websites.
```
Note that I'm not a fan of Wordpress or PHP itself, but it seems like the most common example everywhere. As we can see here it says stable/wordpress so we know that we're using the official repo in the folder stable, but what if we don't want that chart, but someone else provides one with more features or something that You like better. Let's use the one from [Bitnami](https://bitnami.com/stack/wordpress/helm), so if we check their page you can select different kind of deployments but for it to work we need to add another external repo:
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```
So if we search again we will now see two options (at the moment of this writing, the latest version is actually 5.0.2):
```bash
$ helm search wordpress
NAME                    CHART VERSION   APP VERSION     DESCRIPTION
bitnami/wordpress       5.0.2           5.0.2           Web publishing platform for building blogs and websites.
stable/wordpress        3.3.0           4.9.8           Web publishing platform for building blogs and websites.
```
Let's check the [documentation](https://github.com/helm/charts/tree/master/stable/wordpress) of the chart to create our `values.yaml` file, note that in this example the stable wordpress chart it's also maintained by Bitnami, so they have the same configuration :), this won't always be the case but it simplifies things for us.

Our example `values.yaml` will look like:
```
wordpressBlogName: "Testing Helm Charts"
persistence:
  size: 1Gi
ingress:
  enabled: true
```
We will only change the blog name by default, the persistent volume size and also enable [ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) (Our app should be available through `wordpress.local` inside the cluster), if you are using minikube be sure to enable the [ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) addon.
```bash
$ minikube addons enable ingress
ingress was successfully enabled
```

We can then install `stable/wordpress` or `bitnami/wordpress`, we will follow up with the one from Bitnami repo.
```bash
$ helm install bitnami/wordpress \
--set image.repository=bitnami/wordpress \
--set image.tag=5.0.2 \
-f values.yaml
```
As it's a common good practice to use specific versions we will do it here, it's better to do it this way because you can easily move between known versions and also avoid unknown states, this can happen by misunderstanding what latest means, [follow the example](https://medium.com/@mccode/the-misunderstood-docker-tag-latest-af3babfd6375).

You should see something like:
```bash
NAME:   plucking-condor
LAST DEPLOYED: Mon Dec 24 13:06:38 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Pod(related)
NAME                                        READY  STATUS             RESTARTS  AGE
plucking-condor-wordpress-84845db8b5-hkqhc  0/1    ContainerCreating  0         0s
plucking-condor-mariadb-0                   0/1    Pending            0         0s

==> v1/Secret

NAME                       AGE
plucking-condor-mariadb    0s
plucking-condor-wordpress  0s

==> v1/ConfigMap
plucking-condor-mariadb        0s
plucking-condor-mariadb-tests  0s

==> v1/PersistentVolumeClaim
plucking-condor-wordpress  0s

==> v1/Service
plucking-condor-mariadb    0s
plucking-condor-wordpress  0s

==> v1beta1/Deployment
plucking-condor-wordpress  0s

==> v1beta1/StatefulSet
plucking-condor-mariadb  0s

==> v1beta1/Ingress
wordpress.local-plucking-condor  0s


NOTES:
1. Get the WordPress URL:

  You should be able to access your new WordPress installation through
  http://wordpress.local/admin

2. Login with the following credentials to see your blog

  echo Username: user
  echo Password: $(kubectl get secret --namespace default plucking-condor-wordpress -o jsonpath="{.data.wordpress-password}" | base64 --decode)
```
Depending on the cluster provider or installation itself, you might need to replace the `persistence.storageClass` to match what your cluster has, note that in the values file is represented like JSON with dot notation but in your `values.yaml` you need to stick to YAML format and indent `storageClass` under persistence as usual, the kubernetes API parses and uses JSON but YAML seems more human friendly.

At this point we should a working wordpress installation, also move between versions, but be aware that the application is in charge of the database schema and updating it to match what the new version needs, this can also be troublesome rolling back or when downgrading, so if you use persistent data *ALWAYS* have a working backup, because when things go south, you will want to quickly go back to a known state, also note that I said "working backup", yes, test that the backup works and that You can restore it somewhere else before doing anything destructive or that can has repercussions, this will bring you peace of mind and better ways to organize yourself while upgrading, etc.

Now let's check that all resources are indeed working and that we can use our recently installed app.
```bash
$ kubectl get all
NAME                                             READY     STATUS        RESTARTS   AGE
pod/plucking-condor-mariadb-0                    1/1       Running       0          12m
pod/plucking-condor-wordpress-84845db8b5-hkqhc   1/1       Running       0          12m

NAME                                TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)                      AGE
service/kubernetes                  ClusterIP      10.96.0.1        <none>           443/TCP                      37h
service/plucking-condor-mariadb     ClusterIP      10.106.219.59    <none>           3306/TCP                     12m
service/plucking-condor-wordpress   LoadBalancer   10.100.239.163   10.100.239.163   80:31764/TCP,443:32308/TCP   12m

NAME                                        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/plucking-condor-wordpress   1         1         1            1           12m

NAME                                                   DESIRED   CURRENT   READY     AGE
replicaset.apps/plucking-condor-wordpress-84845db8b5   1         1         1         12m

NAME                                       DESIRED   CURRENT   AGE
statefulset.apps/plucking-condor-mariadb   1         1         12m
```
You can deploy it to a custom namespace (In this case I deployed it to the default namespace), the only change for that would be to set the parameter `--namespace` in the `helm install` line.

If you use minikube then ingress will expose a nodeport that we can find using `minikube service list` then using the browser or curl to navigate our freshly installed wordpress.
```bash
 $ minikube service list
|-------------|---------------------------|--------------------------------|
|  NAMESPACE  |           NAME            |              URL               |
|-------------|---------------------------|--------------------------------|
| default     | kubernetes                | No node port                   |
| default     | plucking-condor-mariadb   | No node port                   |
| default     | plucking-condor-wordpress | http://192.168.99.100:31764    |
|             |                           | http://192.168.99.100:32308    |
| kube-system | default-http-backend      | http://192.168.99.100:30001    |
| kube-system | kube-dns                  | No node port                   |
| kube-system | kubernetes-dashboard      | No node port                   |
| kube-system | tiller-deploy             | No node port                   |
|-------------|---------------------------|--------------------------------|
```
In the cloud or on premises this will indeed be different and you should have a publicly available installation using your own domain name (In this case http is at: http://192.168.99.100:31764 and https at: http://192.168.99.100:32308, and http://192.168.99.100:30001 is the default backend for the ingress controller), your ips can be different but the basics are the same.

Sample screenshot:

![Wordpress example](/img/wordpress-example.png)

### Notes
As long as we have the [persistent volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) our data should be preserved in this case the PV is used for tha database, but we could add another volume to preserve images, etc.

Clean everything up:
```bash
helm del --purge plucking-condor
```

That's all I have for now, I will be adding more content next week.

### Don't Repeat Yourself
DRY is a good design goal and part of the art of a good template is knowing when to add a new template and when to update or use an existing one. While helm and go helps with that, there is no perfect tool so we will explore other options in the following posts, explore what the community provides and what seems like a suitable tool for you. Happy Helming!.

### Upcoming topics
The following posts will be about package managers, development deployment tools, etc. It's hard to put all the tools in a category, but they are trying to solve similar problems in different ways, and we will be exploring the ones that seem more promising to me, if you would like me to cover any other tool/project/whatever, just send me a message :)

* Getting started with Ksonnet and friends.
* Getting started with Skaffold.
* Getting started with Gitkube.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
