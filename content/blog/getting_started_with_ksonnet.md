---
author: "Gabriel Garrido"
date: 2018-12-27
linktitle: Getting started with ksonnet
title: Getting started with ksonnet
highlight: true
tags:
- ksonnet
- jsonnet
- deployment_tools
categories:
- deployment_tools
---

### **Introduction**

This tutorial will show you how to create a simple application and also how to deploy it to kubernetes using [ksonnet](https://ksonnet.io/), in the examples I will be using [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube) or you can [check out this repo](https://github.com/kainlite/kainlite.github.io) that has a good overview of minikube, once installed and started (`minikube start`) that command will download and configure the local environment, if you have been following the previous posts you already have minikube installed and working, before we dive into an example let's review some terminology from ksonnet (extracted from the [official documentation](https://ksonnet.io/docs/concepts/)):

#### Application
A ksonnet application represents a well-structured directory of Kubernetes manifests (this is generated using the `ks init`).

#### Environment
An environment consists of four elements, some of which can be pulled from your current kubeconfig context: Name, Server, Namespace, API version. The environment determines to which cluster you're going to deploy the application.

#### Component
A component can be as simple as a Kubernetes resource (a Pod, Deployment, etc), or a fully working stack for example EFK/ELK, you can generate components using `ks generate`.

#### Prototype
Prototype + Parameters = Component. Think of a prototype as a base template before you apply the parameters, to set a name, replicas, etc for the resource, you can explore some system prototypes with `ks prototype`.

#### Parameter
It gives live to a component with dynamic values, you can use `ks param` to view or modify params, there are App params (global), Component params, and Environment params (overrides app params).

#### Module
Modules provide a way for you to share components across environments. More concisely, a module refers to a subdirectory in components/ containing its own params.libsonnet. To create a module `ks module create <module name>`.

#### Part
It provides a way to organize and re-use code.

#### Package
A package is a set of related prototypes and associates helper libraries, it allows you to create and share packages between applications.

#### Registry
It's essentially a repository for packages, it supports the incubator registry, github, filesystem, and Helm.

#### Manifest
The same old YAML or JSON manifest but this time written in [Jsonnet](https://jsonnet.org/learning/tutorial.html), basically Jsonnet is a simple extension of JSON.

Phew, that's a lot of names and terminology at once, let's get started with the terminal already.

### Let's get started
This command will generate the following folder structure `ks init wordpress`:
```bash
INFO Using context "minikube" from kubeconfig file "~/.kube/config"
INFO Creating environment "default" with namespace "default", pointing to "version:v1.12.4" cluster at address "https://192.168.99.100:8443"
INFO Generating ksonnet-lib data at path '~/k8s-examples/wordpress/lib/ksonnet-lib/v1.12.4'

$ ls -l |  awk '{ print $9 }'
app.yaml        <--- Defines versions, namespace, cluster address, app name, registry.
components      <--- Components by default it's empty and has a params file.
environments    <--- By default there is only one environment called default.
lib             <--- Here we can find the ksonnet helpers that match the Kubernetes API with the common resources (Pods, Deployments, etc).
vendor          <--- Here is where the installed packages/apps go, it can be seen as a dependencies folder.
```

Let's generate a _deployed-service_ and inspect it's context:
```bash
$ ks generate deployed-service wordpress \
  --image bitnami/wordpress:5.0.2 \
  --type ClusterIP

INFO Writing component at '~/k8s-examples/wordpress/components/wordpress.jsonnet'
```
At the moment of this writing the latest version of Wordpress is 5.0.2, it's always recommended to use static version numbers instead of tags like latest (because latest can not be latest).

Let's see how our component looks like:
```json
local env = std.extVar("__ksonnet/environments");
local params = std.extVar("__ksonnet/params").components.wordpress;
[
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "name": params.name
    },
    "spec": {
      "ports": [
        {
          "port": params.servicePort,
          "targetPort": params.containerPort
        }
      ],
      "selector": {
        "app": params.name
      },
      "type": params.type
    }
  },
  {
    "apiVersion": "apps/v1beta2",
    "kind": "Deployment",
    "metadata": {
      "name": params.name
    },
    "spec": {
      "replicas": params.replicas,
      "selector": {
        "matchLabels": {
          "app": params.name
        },
      },
      "template": {
        "metadata": {
          "labels": {
            "app": params.name
          }
        },
        "spec": {
          "containers": [
            {
              "image": params.image,
              "name": params.name,
              "ports": [
                {
                  "containerPort": params.containerPort
                }
              ]
            }
          ]
        }
      }
    }
  }
]
```
It's just another template for some known resources, a [service](https://kubernetes.io/docs/concepts/services-networking/service/) and a [deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) that's where the name came from: _deployed-service_, but where are those params coming from?

If we run `ks show default`:
```yaml
---
apiVersion: v1
kind: Service
metadata:
  labels:
    ksonnet.io/component: wordpress
  name: wordpress
spec:
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: wordpress
  type: ClusterIP
---
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  labels:
    ksonnet.io/component: wordpress
  name: wordpress
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - image: bitnami/wordpress:5.0.2
        name: wordpress
        ports:
        - containerPort: 80
```
We will see what our package will generate in *YAML* with some good defaults. And by default if you remember from the definitions a component needs a params file to fill the blanks in this case it is `components/params.libsonnet`:
```json
{
  global: {
    // User-defined global parameters; accessible to all component and environments, Ex:
    // replicas: 4,
  },
  components: {
    // Component-level parameters, defined initially from 'ks prototype use ...'
    // Each object below should correspond to a component in the components/ directory
    wordpress: {
      containerPort: 80,
      image: "bitnami/wordpress:5.0.2",
      name: "wordpress",
      replicas: 1,
      servicePort: 80,
      type: "ClusterIP",
    },
  },
}
```
But that's not enough to run wordpress is it?, No is not, we need a database with persistent storage for it to work properly, so we will need to generate and extend another _deployed-service_.

The next step would be to create another component:
```bash
$ ks generate deployed-service mariadb \
  --image bitnami/mariadb:10.1.37 \
  --type ClusterIP

INFO Writing component at '/home/kainlite/Webs/k8s-examples/wordpress/components/mariadb.jsonnet'
```
The latest stable version of MariaDB 10.1 GA at the moment of this writting is 10.1.37.

Then we will need to add a persistent volume and also tell Wordpress to use this MariaDB instance. How do we do that, we will need to modify a few files, like this (in order to re-use things I placed the mysql variables in the global section, for this example that will simplify things, but it might not be the best approach for a production environment):
The resulting `components/params.json` will be:
```json
{
  global: {
    // User-defined global parameters; accessible to all component and environments, Ex:
    // replicas: 4,
    mariadbEmptyPassword: "no",
    mariadbUser: "mywordpressuser",
    mariadbPassword: "mywordpresspassword",
    mariadbDatabase: "bitnami_wordpress",
  },
  components: {
    // Component-level parameters, defined initially from 'ks prototype use ...'
    // Each object below should correspond to a component in the components/ directory
    wordpress: {
      containerPort: 80,
      image: "bitnami/wordpress:5.0.2",
      name: "wordpress",
      replicas: 1,
      servicePort: 80,
      type: "ClusterIP",
    },
    mariadb: {
      containerPort: 3306,
      image: "bitnami/mariadb:10.1.37",
      name: "mariadb",
      replicas: 1,
      servicePort: 3306,
      type: "ClusterIP",
    },
  },
}
```

The resulting `components/wordpress.jsonnet` will be:
```json
local env = std.extVar("__ksonnet/environments");
local params = std.extVar("__ksonnet/params").components.wordpress;
[
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "name": params.name
    },
    "spec": {
      "ports": [
        {
          "port": params.servicePort,
          "targetPort": params.containerPort
        }
      ],
      "selector": {
        "app": params.name
      },
      "type": params.type
    }
  },
  {
    "apiVersion": "apps/v1beta2",
    "kind": "Deployment",
    "metadata": {
      "name": params.name
    },
    "spec": {
      "replicas": params.replicas,
      "selector": {
        "matchLabels": {
          "app": params.name
        },
      },
      "template": {
        "metadata": {
          "labels": {
            "app": params.name
          }
        },
        "spec": {
          "containers": [
            {
              "image": params.image,
              "name": params.name,
              "ports": [
                {
                  "containerPort": params.containerPort
                }
              ],
              "env": [
                {
                    "name": "WORDPRESS_DATABASE_USER",
                    "value": params.mariadbUser,
                },
                {
                    "name": "WORDPRESS_DATABASE_PASSWORD",
                    "value": params.mariadbPassword,
                },
                {
                    "name": "WORDPRESS_DATABASE_NAME",
                    "value": params.mariadbDatabase,
                },
                {
                    "name": "WORDPRESS_HOST",
                    "value": "mariadb",
                }
              ]
            }
          ]
        }
      }
    }
  }
]
```
The only thing that changed here is `spec.containers.env` which wasn't present before.

The resulting `components/mariadb.jsonnet` will be:
```json
local env = std.extVar("__ksonnet/environments");
local params = std.extVar("__ksonnet/params").components.mariadb;
[
{
    "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "name": params.name
        },
        "spec": {
            "ports": [
            {
                "port": params.servicePort,
                "targetPort": params.containerPort
            }
            ],
            "selector": {
                "app": params.name
            },
            "type": params.type
        }
},
{
    "apiVersion": "apps/v1beta2",
    "kind": "Deployment",
    "metadata": {
        "name": params.name
    },
    "spec": {
        "replicas": params.replicas,
        "selector": {
            "matchLabels": {
                "app": params.name
            },
        },
        "template": {
            "metadata": {
                "labels": {
                    "app": params.name
                }
            },
            "spec": {
                "containers": [
                {
                    "image": params.image,
                    "name": params.name,
                    "ports": [
                    {
                        "containerPort": params.containerPort
                    },
                    ],
                    "env": [
                    {
                        "name": "ALLOW_EMPTY_PASSWORD",
                        "value": params.mariadbEmptyPassword,
                    },
                    {
                        "name": "MARIADB_USER",
                        "value": params.mariadbUser,
                    },
                    {
                        "name": "MARIADB_PASSWORD",
                        "value": params.mariadbPassword,
                    },
                    {
                        "name": "MARIADB_ROOT_PASSWORD",
                        "value": params.mariadbPassword,
                    },
                    {
                        "name": "MARIADB_DATABASE",
                        "value": params.mariadbDatabase,
                    },
                    ],
                    "volumeMounts": [
                    {
                        "mountPath": "/var/lib/mysql",
                        "name": "mariadb"
                    }
                    ]
                }
                ],
                "volumes": [
                {
                    "name": "mariadb",
                    "hostPath": {
                        "path": "/home/docker/mariadb-data"
                    }
                }
                ]
            }
        }
    }
}
]
```
I know, I know, that is a lot of JSON, I trust you have a decent scroll :).

The only things that changed here are `spec.containers.env`, `spec.containers.volumeMount` and `spec.volumes` which weren't present before, that's all you need to make wordpress work with mariadb.

This post only scratched the surface of what Ksonnet and Jsonnet can do, in another post I will describe more advances features with less _JSON_ / _YAML_. There are a lot of things that can be improved and we will cover those things in the next post, if you want to see all the source code for this post go [here](https://github.com/kainlite/ksonnet-wordpress-example).

Let's clean up `ks delete default`:
```bash
INFO Deleting services mariadb
INFO Deleting deployments mariadb
INFO Deleting services wordpress
INFO Deleting deployments wordpress
```

### Notes

If you want to check the wordpress installation via browser you can do `minikube proxy` and then look up the following URL: [Wordpress](http://localhost:8001/api/v1/namespaces/default/services/wordpress/proxy/) (I'm using the default namespace here and the service name is wordpress, if you use ingress you don't need to do this step)

I'm not aware if Ksonnet supports releases and rollbacks like Helm, but it seems it could be emulated using git tags and just some git hooks.

If everything goes well, you should see something like this in the logs:
```bash
$ kubectl logs -f wordpress-5b4d6bd47c-bdtmw

Welcome to the Bitnami wordpress container
Subscribe to project updates by watching https://github.com/bitnami/bitnami-docker-wordpress
Submit issues and feature requests at https://github.com/bitnami/bitnami-docker-wordpress/issues

nami    INFO  Initializing apache
apache  INFO  ==> Patching httpoxy...
apache  INFO  ==> Configuring dummy certificates...
nami    INFO  apache successfully initialized
nami    INFO  Initializing php
nami    INFO  php successfully initialized
nami    INFO  Initializing mysql-client
nami    INFO  mysql-client successfully initialized
nami    INFO  Initializing libphp
nami    INFO  libphp successfully initialized
nami    INFO  Initializing wordpress
mysql-c INFO  Trying to connect to MySQL server
mysql-c INFO  Found MySQL server listening at mariadb:3306
mysql-c INFO  MySQL server listening and working at mariadb:3306
wordpre INFO
wordpre INFO  ########################################################################
wordpre INFO   Installation parameters for wordpress:
wordpre INFO     First Name: FirstName
wordpre INFO     Last Name: LastName
wordpre INFO     Username: user
wordpre INFO     Password: **********
wordpre INFO     Email: user@example.com
wordpre INFO     Blog Name: User's Blog!
wordpre INFO     Table Prefix: wp_
wordpre INFO   (Passwords are not shown for security reasons)
wordpre INFO  ########################################################################
wordpre INFO
nami    INFO  wordpress successfully initialized
INFO  ==> Starting wordpress...
[Thu Dec 27 04:30:59.684053 2018] [ssl:warn] [pid 116] AH01909: localhost:443:0 server certificate does NOT include an ID which matches the server name
[Thu Dec 27 04:30:59.684690 2018] [ssl:warn] [pid 116] AH01909: localhost:443:0 server certificate does NOT include an ID which matches the server name
[Thu Dec 27 04:30:59.738783 2018] [ssl:warn] [pid 116] AH01909: localhost:443:0 server certificate does NOT include an ID which matches the server name
[Thu Dec 27 04:30:59.739701 2018] [ssl:warn] [pid 116] AH01909: localhost:443:0 server certificate does NOT include an ID which matches the server name
[Thu Dec 27 04:30:59.765798 2018] [mpm_prefork:notice] [pid 116] AH00163: Apache/2.4.37 (Unix) OpenSSL/1.1.0j PHP/7.2.13 configured -- resuming normal operations
[Thu Dec 27 04:30:59.765874 2018] [core:notice] [pid 116] AH00094: Command line: 'httpd -f /bitnami/apache/conf/httpd.conf -D FOREGROUND'
172.17.0.1 - - [27/Dec/2018:04:31:00 +0000] "GET / HTTP/1.1" 200 3718
172.17.0.1 - - [27/Dec/2018:04:31:01 +0000] "GET /wp-includes/js/wp-embed.min.js?ver=5.0.2 HTTP/1.1" 200 753
172.17.0.1 - - [27/Dec/2018:04:31:01 +0000] "GET /wp-includes/css/dist/block-library/theme.min.css?ver=5.0.2 HTTP/1.1" 200 452
172.17.0.1 - - [27/Dec/2018:04:31:01 +0000] "GET /wp-includes/css/dist/block-library/style.min.css?ver=5.0.2 HTTP/1.1" 200 4281
172.17.0.1 - - [27/Dec/2018:04:31:01 +0000] "GET /wp-content/themes/twentynineteen/style.css?ver=1.1 HTTP/1.1" 200 19371
172.17.0.1 - - [27/Dec/2018:04:31:01 +0000] "GET /wp-content/themes/twentynineteen/print.css?ver=1.1 HTTP/1.1" 200 1230
```

And that folks is all I have for now, be sure to check out the [Ksonnet official documentation](https://ksonnet.io/docs/) and `ks help` to know more about what ksonnet can do to help you deploy your applications to any kubernetes cluster.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
