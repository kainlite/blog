---
author: "Gabriel Garrido"
date: 2022-10-25
linktitle: Testing tekton to build and push images for my K3S ARM Oracle cluster 
title: Testing tekton to build and push images for my K3S ARM Oracle cluster 
highlight: true
tags:
- kubernetes
- arm
- linux
- cicd
- tekton
categories:
- kubernetes
images:
  - "/img/tekton-logo.png"
---

#### **Introduction**
In this article we will explore how to deploy and configure tekton to build and push images to your registry to be
consumed from your cluster, we will also see how these are deployed in another article. In this one I want to show you
how to get the images ready to use, and also a handy solution for a CI system without having to rely on external
factors, in my case I was having issues with docker building cross-architecture images and after setting up tekton
everything was faster and simpler, cross-architecture is slow by default but can also not work a 100% as you would
expect, by using this approach we can just forget about the architecture and just build where we run things, it is
definitely faster and even some of your nodes will already have the images available meaning less bandwidth consumption
as well in the long run.

##### **Sources**

* [tr](https://github.com/kainlite/tr), go ahead and check it out, my new blog runs there: https://tr.techsquad.rocks
  you can check the manifests used here in the `manifests` folder.

The source code and/or documentation of the projects that we will be testing are listed here:
* [tekton](https://tekton.dev/docs/)
* [tekton-triggers](https://tekton.dev/docs/triggers/)
* [kaniko](https://github.com/GoogleContainerTools/kaniko)

#### Installing tekton-pipelines and tekton-triggers
Why do we need tekton-pipelines or tekton-triggers again? pipelines allows you to run multiple tasks in order and pass
things around (this is basic to tekton and to any CI/CD system), then we need to do something when we push for example
to our git repository, that's when tekton-triggers gets handy and let us react to changes and trigger a build or some 
process, interceptors are a part of tekton-triggers and let's say it gives you flexibility using events.
```bash
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/interceptors.yaml
```

Then we need to install `tkn` locally and configure some packages from the hub
```
tkn -n tekton-pipelines hub install task git-clone
tkn -n tekton-pipelines hub install task kaniko
tkn -n tekton-pipelines hub install task kubernetes-actions
```

In my deployment I used fixed versions which is recommended for any kind of "production" deployment, you can see the
readme [here](https://github.com/kainlite/tr/blob/master/manifests/tekton/README.md).

#### Let's get to business
##### tekton-pipelines
Okay, so we have tekton and friends installed, ready for business, but what now? well, it's a bit tricky and require a
few manifests to get going, so I will try to explain what is happening with each file and why do we need them.

You can see this file in github as well
[01-pipeline.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/pipelines/01-pipeline.yaml),
basically we need to define a pipeline which defines the steps and what it will happen, here we are cloning the
repository, then building it with kaniko and then pushing it to the docker registry, note that the script is hardcoded
there that could be dynamic but not really necessary for my use case.
```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: clone-build-push
  namespace: tekton-pipelines
spec:
  description: | 
    This pipeline clones a git repo, builds a Docker image with Kaniko and
    pushes it to a registry
  params:
  - name: repo-url
    type: string
  - name: image-reference
    type: string
  workspaces:
  - name: shared-data
  - name: docker-credentials
  tasks:
  - name: fetch-source
    taskRef:
      name: git-clone
    workspaces:
    - name: output
      workspace: shared-data
    params:
    - name: url
      value: $(params.repo-url)
  - name: build-push
    runAfter: ["fetch-source"]
    taskRef:
      name: kaniko
    workspaces:
    - name: source
      workspace: shared-data
    - name: dockerconfig
      workspace: docker-credentials
    params:
    - name: IMAGE
      value: $(params.image-reference)
  - name: restart-deployment
    runAfter: ["build-push"]
    taskRef:
      name: kubernetes-actions
    params:
    - name: script
      value: |
        kubectl -n tr rollout restart deployment/tr-deployment
```
---
You can see this file in github as well 
[02-pipeline-run.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/pipelines/02-pipeline-run.yaml), 
This is basically to run our defined pipeline with specific values, we will use something very similar from the trigger
to run automatically when we push commits to our repo, the docker secret is a regular dockercfg secret mounted so we can
push to that registry.
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: clone-build-push-run
  namespace: tekton-pipelines
spec:
  pipelineRef:
    name: clone-build-push
  podTemplate:
    securityContext:
      fsGroup: 65532
  workspaces:
  - name: shared-data
    volumeClaimTemplate:
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
  - name: kubeconfig-dir
    configMap:
      name: kubeconfig
  - name: docker-credentials
    secret:
      secretName: docker-credentials
  params:
  - name: repo-url
    value: https://github.com/kainlite/tr.git
  - name: image-reference
    value: kainlite/tr:latest
```
With all that we have a basic pipeline but we need to trigger it or run it manually, let's add the necessary manifests
for it to react to changes in our github repository...

---

##### tekton-triggers
You can see this file in github as well [01-rbac.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/triggers/01-rbac.yaml), 
let's give tekton-triggers some permissions
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-triggers-sa
  namespace: tekton-pipelines
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tekton-triggers-minimal
  namespace: tekton-pipelines
rules:
# EventListeners need to be able to fetch all namespaced resources
- apiGroups: ["triggers.tekton.dev"]
  resources: ["eventlisteners", "triggerbindings", "triggertemplates", "triggers"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
# configmaps is needed for updating logging config
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
# Permissions to create resources in associated TriggerTemplates
- apiGroups: ["tekton.dev"]
  resources: ["pipelineruns", "pipelineresources", "taskruns"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["serviceaccounts"]
  verbs: ["impersonate"]
- apiGroups: ["policy"]
  resources: ["podsecuritypolicies"]
  resourceNames: ["tekton-triggers"]
  verbs: ["use"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tekton-triggers-binding
  namespace: tekton-pipelines
subjects:
- kind: ServiceAccount
  name: tekton-triggers-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tekton-triggers-minimal
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: tekton-triggers-clusterrole
rules:
  # EventListeners need to be able to fetch any clustertriggerbindings
- apiGroups: ["triggers.tekton.dev"]
  resources: ["clustertriggerbindings", "clusterinterceptors"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tekton-triggers-clusterbinding
subjects:
- kind: ServiceAccount
  name: tekton-triggers-sa
  namespace: tekton-pipelines
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-clusterrole
```
---

You can see this file on github as well 
[02-eventlistener.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/triggers/02-eventlistener.yaml),
This is where things get a bit tricky, in theory you don't need a secret to read your repo if it is public, but it was
private when I started testing this, then it was made public, if you are interested  in the format of the secret check
below this yaml, however this only "listens" to events in our repo and triggers an event using our pipeline, we still
need an ingress for the webhook and other configs as we will see in the next steps.
```
apiVersion: triggers.tekton.dev/v1alpha1
kind: EventListener
metadata:
  name: clone-build-push
  namespace: tekton-pipelines
spec:
  serviceAccountName: tekton-triggers-sa
  triggers:
    - name: github-listener
      interceptors:
        - ref:
            name: "github"
          params:
            - name: "secretRef"
              value:
                secretName: github-interceptor-secret
                secretKey: secretToken
            - name: "eventTypes"
              value: ["push"]
        - ref:
            name: "cel"
      bindings:
        - ref: clone-build-push-binding
      template:
        ref: clone-build-push-template
```

The secret would be something like the one depicted below, replace `secretToken` with your generated token this will be
used for the webhook configuration so save it somewhere safe until it is configured there.
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: github-interceptor-secret
type: Opaque
stringData:
  secretToken: "1234567"
```
---

You can see this file on github as well 
[04-triggerbinding.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/triggers/04-triggerbinding.yaml),
When we receive the webhook we can get some information from it, basically we are interested in the repo URL and the
commit SHA.
```yaml
apiVersion: triggers.tekton.dev/v1alpha1
kind: TriggerBinding
metadata:
  name: clone-build-push-binding
  namespace: tekton-pipelines
spec:
  params:
    - name: gitrepositoryurl
      value: $(body.repository.clone_url)
    - name: gitrevision
      value: $(body.pull_request.head.sha)
```
---

You can see this file in github as well
[05-triggertemplate.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/triggers/05-triggertemplate.yaml),
This would be the equivalent of the manually run pipelinerun that we have, but this uses the trigger and the template to
automatically trigger, hence the similarities.
```yaml
apiVersion: triggers.tekton.dev/v1alpha1
kind: TriggerTemplate
metadata:
  name: clone-build-push-template
  namespace: tekton-pipelines
spec:
  params:
    - name: gitrevision
      description: The git revision (SHA)
      default: master
    - name: gitrepositoryurl
      description: The git repository url ("https://github.com/foo/bar.git")
  resourcetemplates:
    - apiVersion: tekton.dev/v1beta1
      metadata:
        namespace: tekton-pipelines
        generateName: clone-build-push-
      spec:
        pipelineRef:
          name: clone-build-push
        podTemplate:
          securityContext:
            fsGroup: 65532
        workspaces:
        - name: shared-data
          volumeClaimTemplate:
            spec:
              accessModes:
              - ReadWriteOnce
              resources:
                requests:
                  storage: 1Gi
        - name: kubeconfig-dir
          configMap:
            name: kubeconfig
        - name: docker-credentials
          secret:
            secretName: docker-credentials
        params:
        - name: repo-url
          value: https://github.com/kainlite/tr.git
        - name: image-reference
          value: kainlite/tr:$(tt.params.gitrevision)
      kind: PipelineRun
```
---

You can see this file on github as well 
[06-ingress.yaml](https://github.com/kainlite/tr/blob/master/manifests/tekton/triggers/06-ingress.yaml),
And last but not least the ingress configuration, without this it won't work because we need to receive a request from
github, to configure that just go to settings on the repository, hit webhooks and create a new one with the secret token
that you generated and put your URL as `https://subdomain.domain/hooks`, then mark TLS on, only push and active.
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tr-ingress
  namespace: tekton-pipelines
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: "/"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    service.beta.kubernetes.io/do-loadbalancer-enable-proxy-protocol: "true"
    use-proxy-protocol: "true"
spec:
  tls:
  - hosts:
      - trgh.techsquad.rocks
    secretName: tr-prod-tls
  rules:
    - host: trgh.techsquad.rocks
      http:
        paths:
          - path: /hooks
            pathType: Exact
            backend:
              service:
                name: el-clone-build-push
                port:
                  number: 8080
```

WHEW! that was a lot of work but trust me it's worth it, now you can build, push and run your images from your cluster,
with no external or weird CI/CD system and everything following a GitOps model since everything can be committed and
applied from your repository, in my case I'm using ArgoCD and Kustomize to apply everything but that is for another
chapter.

---

#### Then let's validate that it works
We have the event listener ready:
```bash
❯ tkn -n tekton-pipelines eventlistener list
NAME               AGE           URL                                                                  AVAILABLE
clone-build-push   5 seconds ago   http://el-clone-build-push.tekton-pipelines.svc.cluster.local:8080   True
```

We have the pipeline, notice that it says failed this is because there is an issue with ARM that it is still not solved
but everything actually works as expected:
```bash
❯ tkn -n tekton-pipelines pipeline list
NAME               AGE           LAST RUN                 STARTED       DURATION   STATUS
clone-build-push   5 seconds ago   clone-build-push-5qkv6   5 weeks ago   4m26s      Failed
```

We can see the pipelinerun being triggered, same issue as described before, see the notes for the github issues:
```bash
❯ tkn -n tekton-pipelines pipelinerun list
NAME                           STARTED       DURATION   STATUS
clone-build-push-5qkv6         5 seconds ago   4m26s      Failed
clone-build-push-blkrm         5 seconds ago   3m58s      Failed
```

We can also see some of the other resources created for tekton:
```bash
❯ tkn -n tekton-pipelines triggertemplate list
NAME                          AGE
clone-build-push-template     5 seconds ago

❯ tkn -n tekton-pipelines triggertemplate describe clone-build-push-template
Name:        clone-build-push-template
Namespace:   tekton-pipelines

⚓ Params

 NAME                 DESCRIPTION              DEFAULT VALUE
 ∙ gitrevision        The git revision (S...   master
 ∙ gitrepositoryurl   The git repository ...   ---

📦 ResourceTemplates

 NAME    GENERATENAME        KIND          APIVERSION
 ∙ ---   clone-build-push-   PipelineRun   tekton.dev/v1beta1
```

You can also see the pods created or logs using either `kubectl` or `tkn`:
```bash
tekton-pipelines   clone-build-push-vt6jz-fetch-source-pod                  0/1     Completed   0             1d
tekton-pipelines   clone-build-push-wzlkb-build-push-pod                    0/2     Completed   0             1d
```

I hope this is useful for someone and if you are having issues with your CI/CD system give tekton a go, you will love
it, in my particular case I was having many issues with ARM and building for it, it was slow, had a ton of weird errors
and all that went away by building the images where I run things, it's faster and it also utilizes the idle computing
power.

#### Some of the sources and known issues
This post was heavily insipired by these articles, and it was configured and tested following these examples:

https://github.com/tektoncd/triggers/blob/main/docs/getting-started/README.md 

https://tekton.dev/docs/how-to-guides/kaniko-build-push/#full-code-samples 

https://www.arthurkoziel.com/tutorial-tekton-triggers-with-github-integration/

There are some issues running on ARM, on other architectures it just works, see more: 

https://github.com/tektoncd/pipeline/issues/4247

https://github.com/tektoncd/pipeline/issues/5233

But everything should just work tm.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io)
and the [sources here](https://github.com/kainlite/blog).
