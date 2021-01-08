---
author: "Gabriel Garrido"
date: 2021-01-07
linktitle: Kubernetes image policy webhook explained
title: Kubernetes image policy webhook explained
highlight: true
tags:
- kubernetes
- linux
- security
- docker
categories:
- kubernetes
images:
  - "/img/kubernetes-admission-phases.png"
---

#### Introduction
In this article we will explore how webhook works in kubernetes and more specifically about the ImagePolicyWebhook, the kubernetes documentation about it is kind of vague, since there is no real example or implementation that you can get out of it, so here we will break it down to the different alternatives, in a real world scenario I would prefer to rely in [OPA Gatekeeper](https://github.com/open-policy-agent/gatekeeper), I'm planning to make this trip worth by adding a database and make the webhook allow or disallow images based in the vulnerability scan, for example allow only medium or lower vulnerabilities in your containers, but that will be a post for another day, if you are interested you can help in this [repo](https://github.com/kainlite/kube-image-bouncer), [see more]({{< ref "#closing-words" >}}).

There are two ways to make this work each one has a slightly different behavior, one way is using the [ImagePolicyWebhook](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#imagepolicywebhook) and the other is using an [Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/) either works validating or mutating, here I used the validating webhook, you can learn more [here](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/).

This admission controller will reject all the pods that are using images with the `latest` tag and in the future we will see if all pods that are not able to meet the required security levels.

#### Comparison

The [ImagePolicyWebhook](https://kubernetes.io/docs/admin/admission-controllers/#imagepolicywebhook) is an admission controller that evaluates only images, you need to parse the requests do the logic and the response in order to allow or deny images in the cluster.

The good parts about the `ImagePolicyWebhook`:
* The API server can be instructed to reject the images if the webhook endpoint is not reachable, this is quite handy but it can also bring issues, like core pods won't be able to schedule for example.

The bad parts about the `ImagePolicyWebhook`:
* The configuration is a bit more involved and requires access to the master nodes or to the apiserver configuration, the documentation is not clear and it can be hard to make changes, update, etc.
* The deployment is not so trivial as you need to deploy it with systemd or run it as a docker container in the host, update the dns, etc.

On the other hand the [ValidatingAdmissionWebhook](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers) can be used for way more things that just images (if you use the mutating one, well, you can inject or change things on the fly).

The good parts about the `ValidatingAdmissionWebhook`:
* Easier deployment since the service runs as a pod.
* Everything can be a kubernetes resource.
* Less manual intervention and access to the master is not required.

The bad parts about the `ValidatingAdmissionWebhook`:
* If the pod or service is unavailable then all images are going to be allowed which can be a security risk in some cases, so if you are going this path be sure to make it highly available.

#### Building

If you intend to use it as a plain service:

```
$ go get github.com/kainlite/kube-image-bouncer
```

You can also use this [Docker image](https://hub.docker.com/r/kainlite/kube-image-bouncer/):
```
$ docker pull kainlite/kube-image-bouncer
```

#### Certificates
We can rely in the kubernetes CA to generate the certificate that we need, if you want to learn more go [here](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/):

Create a CSR:
```
$ cat <<EOF | cfssl genkey - | cfssljson -bare server
{
  "hosts": [
    "image-bouncer-webhook.default.svc",
    "image-bouncer-webhook.default.svc.cluster.local",
    "image-bouncer-webhook.default.pod.cluster.local",
    "192.0.2.24",
    "10.0.34.2"
  ],
  "CN": "system:node:image-bouncer-webhook.default.pod.cluster.local",
  "key": {
    "algo": "ecdsa",
    "size": 256
  },
  "names": [
    {
      "O": "system:nodes"
    }
  ]
}
EOF
```

Then apply it to the cluster
```
$ cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: image-bouncer-webhook.default
spec:
  request: $(cat server.csr | base64 | tr -d '\n')
  signerName: kubernetes.io/kubelet-serving
  usages:
  - digital signature
  - key encipherment
  - server auth
EOF
```

Approve and get your certificate for later use
```
$ kubectl get csr image-bouncer-webhook.default -o jsonpath='{.status.certificate}' | base64 --decode > server.crt
```

#### ImagePolicyWebhook path

There are two possible ways to deploy this controller (webhook), for this to work you will need to create the certificates as explained below, but first
we need to take care of other details add this to your hosts file in the master or where the bouncer will run:

We use this name because it has to match with the names from the certificate, since this will run outside kuberntes and it could even be externally available, we just fake it with a hosts entry
```
$ echo "127.0.0.1 image-bouncer-webhook.default.svc" >> /etc/hosts
```

Also in the apiserver you need to update it with these settings:
```
--admission-control-config-file=/etc/kubernetes/kube-image-bouncer/admission_configuration.json
--enable-admission-plugins=ImagePolicyWebhook
```
If you did this method you don't need to create the `validating-webhook-configuration.yaml` resource nor apply the kubernetes deployment to run in the cluster.

Create an admission control configuration file named `/etc/kubernetes/kube-image-bouncer/admission_configuration.json` file with the following contents:
```json
{
  "imagePolicy": {
     "kubeConfigFile": "/etc/kubernetes/kube-image-bouncer/kube-image-bouncer.yml",
     "allowTTL": 50,
     "denyTTL": 50,
     "retryBackoff": 500,
     "defaultAllow": false
  }
}
```
Adjust the defaults if you want to allow images by default.

Create a kubeconfig file `/etc/kubernetes/kube-image-bouncer/kube-image-bouncer.yml` with the following contents:
```yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: /etc/kubernetes/kube-image-bouncer/pki/server.crt
    server: https://image-bouncer-webhook.default.svc:1323/image_policy
  name: bouncer_webhook
contexts:
- context:
    cluster: bouncer_webhook
    user: api-server
  name: bouncer_validator
current-context: bouncer_validator
preferences: {}
users:
- name: api-server
  user:
    client-certificate: /etc/kubernetes/pki/apiserver.crt
    client-key:  /etc/kubernetes/pki/apiserver.key
```
This configuration file instructs the API server to reach the webhook server at `https://image-bouncer-webhook.default.svc:1323` and use its `/image_policy` endpoint, we're reusing the certificates from the apiserver and the one for kube-image-bouncer that we already generated.

Be aware that you need to be sitting in the folder with the certs for that to work:
```
$ docker run --rm -v `pwd`/server-key.pem:/certs/server-key.pem:ro -v `pwd`/server.crt:/certs/server.crt:ro -p 1323:1323 --network host kainlite/kube-image-bouncer -k /certs/server-key.pem -c /certs/server.crt
```

#### ValidatingAdmissionWebhook path

If you are going this path, all you need to do is generate the certificates, everything else can be done with kubectl, first of all you have to create a tls secret holding the webhook certificate and key (we just generated this in the previous step):

```
$ kubectl create secret tls tls-image-bouncer-webhook \
  --key server-key.pem \
  --cert server.pem
```

Then create a kubernetes deployment for the `image-bouncer-webhook`:
```
$ kubectl apply -f kubernetes/image-bouncer-webhook.yaml
```

Finally create `ValidatingWebhookConfiguration` that makes use of our webhook endpoint, you can use this but be sure to update the caBundle with the `server.crt` content in base64:
```
$ kubectl apply -f kubernetes/validating-webhook-configuration.yaml
```

Or you can can simply generate the `validating-webhook-configuration.yaml` file like this and apply it in one go:
```
$ cat <<EOF | kubectl apply -f -
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: image-bouncer-webook
webhooks:
  - name: image-bouncer-webhook.default.svc
    rules:
      - apiGroups:
          - ""
        apiVersions:
          - v1
        operations:
          - CREATE
        resources:
          - pods
    failurePolicy: Ignore
    sideEffects: None
    admissionReviewVersions: ["v1", "v1beta1"]
    clientConfig:
      caBundle: $(kubectl get csr image-bouncer-webhook.default -o jsonpath='{.status.certificate}')
      service:
        name: image-bouncer-webhook
        namespace: default
EOF
```
This could be easily automated (helm chart coming soon...), changes can take a bit to reflect, so wait a few seconds and give it a try.

#### Testing

Both paths should work the same way and you will see a similar error message, example:
```
Error creating: pods "nginx-latest-sdsmb" is forbidden: image policy webhook backend denied one or more images: Images using latest tag are not allowed
```
or
```
Warning  FailedCreate  23s (x15 over 43s)  replication-controller  Error creating: admission webhook "image-bouncer-webhook.default.svc" denied the request: Images using latest tag are not allowed
```

Create a nginx-versioned RC to validate that versioned releases still work:
```yml
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ReplicationController
metadata:
  name: nginx-versioned
spec:
  replicas: 1
  selector:
    app: nginx-versioned
  template:
    metadata:
      name: nginx-versioned
      labels:
        app: nginx-versioned
    spec:
      containers:
      - name: nginx-versioned
        image: nginx:1.13.8
        ports:
        - containerPort: 80
EOF
```
Ensure/check the replication controller is actually running:
```
$ kubectl get rc
NAME              DESIRED   CURRENT   READY     AGE
nginx-versioned   1         1         0         2h
```

Now create one for nginx-latest to validate that our controller/webhook can actually reject pods with images using the latest tag:
```yml
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ReplicationController
metadata:
  name: nginx-latest
spec:
  replicas: 1
  selector:
    app: nginx-latest
  template:
    metadata:
      name: nginx-latest
      labels:
        app: nginx-latest
    spec:
      containers:
      - name: nginx-latest
        image: nginx
        ports:
        - containerPort: 80
EOF
```

If we check the pod it should not be created and the RC should show something similar to the following output, you can also check with `kubectl get events --sort-by='{.lastTimestamp}'`:
```
$ kubectl describe rc nginx-latest
Name:         nginx-latest
Namespace:    default
Selector:     app=nginx-latest
Labels:       app=nginx-latest
Annotations:  <none>
Replicas:     0 current / 1 desired
Pods Status:  0 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:  app=nginx-latest
  Containers:
   nginx-latest:
    Image:        nginx
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type             Status  Reason
  ----             ------  ------
  ReplicaFailure   True    FailedCreate
Events:
  Type     Reason        Age                 From                    Message
  ----     ------        ----                ----                    -------
  Warning  FailedCreate  23s (x15 over 43s)  replication-controller  Error creating: admission webhook "image-bouncer-webhook.default.svc" denied the request: Images using latest tag are not allowed
```

#### Debugging
It's always useful to see the apiserver logs if you are using the admission controller path since it will log there why did it fail, and also the logs from the image-bouncer, for example:
apiserver
```
W0107 17:39:00.619560       1 dispatcher.go:142] rejected by webhook "image-bouncer-webhook.default.svc": &errors.StatusError{ErrStatus:v1.Status{TypeMeta:v1.TypeMeta{Kind:"", APIVersion:""}, ListMeta:v1.ListMeta{ SelfLink:"", ResourceVersion:"", Continue:"", RemainingItemCount:(*int64)(nil)}, Status:"Failure", Message:"admission webhook \"image-bouncer-webhook.default.svc\" denied the request: Images using latest tag are not allowed", Reason:"", Details:(*v1.StatusDetails)(nil), Code:400}}
```

kube-image-bouncer:
```
echo: http: TLS handshake error from 127.0.0.1:49414: remote error: tls: bad certificate
method=POST, uri=/image_policy?timeout=30s, status=200
method=POST, uri=/image_policy?timeout=30s, status=200
method=POST, uri=/image_policy?timeout=30s, status=200
```
The error is from a manual test, the others are successful requests from the apiserver.

#### The code itself
Lets take a really brief look at the critical parts of creating an admission controller or webhook:

This is a section of the `main.go` as we can see we are handling two `POST` paths with different methods, and some other validations, what we need to know is that the we will receive a POST method call with a JSON payload and that we need to convert to an admission controller review request.
```
    app.Action = func(c *cli.Context) error {
        e := echo.New()
        e.POST("/image_policy", handlers.PostImagePolicy())
        e.POST("/", handlers.PostValidatingAdmission())

        e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
            Format: "method=${method}, uri=${uri}, status=${status}\n",
        }))

        if debug {
            e.Logger.SetLevel(log.DEBUG)
        }

        if whitelist != "" {
            handlers.RegistryWhitelist = strings.Split(whitelist, ",")
            fmt.Printf(
                "Accepting only images from these registries: %+v\n",
                handlers.RegistryWhitelist)
            fmt.Println("WARN: this feature is implemented only by the ValidatingAdmissionWebhook code")
        } else {
            fmt.Println("WARN: accepting images from ALL registries")
        }

        var err error
        if cert != "" && key != "" {
            err = e.StartTLS(fmt.Sprintf(":%d", port), cert, key)
        } else {
            err = e.Start(fmt.Sprintf(":%d", port))
        }

        if err != nil {
            return cli.NewExitError(err, 1)
        }

        return nil
    }

    app.Run(os.Args)
```

This is a section from `handlers/validating_admission.go`, basically it parses and validates if the image should be allowed or not and then it sends an [AdmissionReponse](https://pkg.go.dev/k8s.io/api/admission/v1beta1) back with the flag `Allowed` set to true or false. If you want to learm more about the different types used here you can explore the [v1beta1.Admission Documentation](https://pkg.go.dev/k8s.io/api/admission/v1beta1)
```
func PostValidatingAdmission() echo.HandlerFunc {
    return func(c echo.Context) error {
        var admissionReview v1beta1.AdmissionReview

        err := c.Bind(&admissionReview)
        if err != nil {
            c.Logger().Errorf("Something went wrong while unmarshalling admission review: %+v", err)
            return c.JSON(http.StatusBadRequest, err)
        }
        c.Logger().Debugf("admission review: %+v", admissionReview)

        pod := v1.Pod{}
        if err := json.Unmarshal(admissionReview.Request.Object.Raw, &pod); err != nil {
            c.Logger().Errorf("Something went wrong while unmarshalling pod object: %+v", err)
            return c.JSON(http.StatusBadRequest, err)
        }
        c.Logger().Debugf("pod: %+v", pod)

        admissionReview.Response = &v1beta1.AdmissionResponse{
            Allowed: true,
            UID:     admissionReview.Request.UID,
        }
        images := []string{}

        for _, container := range pod.Spec.Containers {
            images = append(images, container.Image)
            usingLatest, err := rules.IsUsingLatestTag(container.Image)
            if err != nil {
                c.Logger().Errorf("Error while parsing image name: %+v", err)
                return c.JSON(http.StatusInternalServerError, "error while parsing image name")
            }
            if usingLatest {
                admissionReview.Response.Allowed = false
                admissionReview.Response.Result = &metav1.Status{
                    Message: "Images using latest tag are not allowed",
                }
                break
            }

            if len(RegistryWhitelist) > 0 {
                validRegistry, err := rules.IsFromWhiteListedRegistry(
                    container.Image,
                    RegistryWhitelist)
                if err != nil {
                    c.Logger().Errorf("Error while looking for image registry: %+v", err)
                    return c.JSON(
                        http.StatusInternalServerError,
                        "error while looking for image registry")
                }
                if !validRegistry {
                    admissionReview.Response.Allowed = false
                    admissionReview.Response.Result = &metav1.Status{
                        Message: "Images from a non whitelisted registry",
                    }
                    break
                }
            }
        }

        if admissionReview.Response.Allowed {
            c.Logger().Debugf("All images accepted: %v", images)
        } else {
            c.Logger().Infof("Rejected images: %v", images)
        }

        c.Logger().Debugf("admission response: %+v", admissionReview.Response)

        return c.JSON(http.StatusOK, admissionReview)
    }
}
```
Everything is in this [repo](https://github.com/kainlite/kube-image-bouncer).

#### Closing words
This example and the original post were done [here](https://github.com/flavio/kube-image-bouncer), so thank you [Flavio Castelli](https://flavio.castelli.me/) for creating such a great example, my changes are mostly about explaining how it works and the required changes for it to work in the latest kubernetes release (at the moment v1.20.0), as I was learning to use it and to create my own.

The readme file in the project might not match this article but both should work, I didn't update the entire readme yet.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
