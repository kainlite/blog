---
author: "Gabriel Garrido"
date: 2019-01-15
linktitle: From zero to hero with kops and AWS
title: From zero to hero with kops and AWS
highlight: true
tags:
- AWS
- kops
- kubernetes
categories:
- linux
- kubernetes
lua:
  image:
    url: "/img/kubernetes-aws.png"
draft: true
---

### **Introduction**
In this article we will create a cluster from scrath with [kops](https://github.com/kubernetes/kops) (K8s installation, upgrades and management) in [AWS](https://aws.amazon.com/), We will configure [aws-alb-ingress-controller](https://github.com/kubernetes-sigs/aws-alb-ingress-controller) (External traffic into our services/pods) and [external dns](https://github.com/kubernetes-incubator/external-dns) (Update the records based in the ingress rules).

Basically we will have a fully functional cluster that will be able to handle public traffic in minutes, first we will install the cluster with kops, then we will enable the ingress controller and lastly external-dns, then we will deploy a basic app to test that everything works fine, I will also provide an example configuration for SSL/TLS.

Just in case you don't know this setup is not going to be free, cheap for sure because we will use small instances, etc, but not completely free, so before you dive in, be sure that you can spend a few bucks testing it out.

### **Kops**
This is an awesome tool to setup and maintain your clusters, currently only compatible with AWS and GCE, other platforms are planned and some are also supported in alpha, we will be using AWS in this example, it requires kubectl so make sure you have it installed:
{{< highlight bash >}}
curl -LO https://github.com/kubernetes/kops/releases/download/$(curl -s https://api.github.com/repos/kubernetes/kops/releases/latest | grep tag_name | cut -d '"' -f 4)/kops-linux-amd64
chmod +x kops-linux-amd64
sudo mv kops-linux-amd64 /usr/local/bin/kops'"')
{{< /highlight >}}

**Export the credentials that we will be using (output from the create-access-key command)**
{{< highlight bash >}}
export AWS_ACCESS_KEY_ID=XXXX && export AWS_SECRET_ACCESS_KEY=XXXXX
{{< /highlight >}}
You can do it this way or just use `aws configure` and set a profile.

The next thing that we will need is to create IAM credentials for kops to work, but you of course need awscli configured and working with your AWS account:
{{< highlight bash >}}
# Create iam group
aws iam create-group --group-name kops

{
    "Group": {
        "Path": "/",
        "GroupName": "kops",
        "GroupId": "AGPAIABI3O4WYM46AIX44",
        "Arn": "arn:aws:iam::894527626897:group/kops",
        "CreateDate": "2019-01-18T01:04:23Z"
    }
}

aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess --group-name kops
aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonRoute53FullAccess --group-name kops
aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess --group-name kops
aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/IAMFullAccess --group-name kops
aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess --group-name kops

# Attach policies
aws iam create-user --user-name kops
aws iam add-user-to-group --user-name kops --group-name kops

{
    "Group": {
        "Path": "/",
        "GroupName": "kops",
        "GroupId": "AGPAIABI3O4WYM46AIX44",
        "Arn": "arn:aws:iam::894527626897:group/kops",
        "CreateDate": "2019-01-18T01:04:23Z"
    }
}

# Create access key - save the output of this command.
aws iam create-access-key --user-name kops

{
    "AccessKey": {
        "UserName": "kops",
        "AccessKeyId": "AKIAJE*********",
        "Status": "Active",
        "SecretAccessKey": "zWJhfemER**************************",
        "CreateDate": "2019-01-18T01:05:44Z"
    }
}
{{< /highlight >}}
The last command will output the access key and the secret key for the _kops_ user, save that information because we will use it from now on, note that we gave kops a lot of power with that user, so be careful with the keys.

Additional permissions to be able to create ALBs:
{{< highlight bash >}}
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Effect": "Allow",
     "Action": [
       "ec2:DescribeAccountAttributes",
       "ec2:DescribeInternetGateways",
       "iam:CreateServiceLinkedRole"
     ],
     "Resource": [
       "*"
     ]
   }
 ]
}


aws iam create-policy --policy-name kops-alb-policy --policy-document file://kops-alb-policy.json
{
    "Policy": {
        "PolicyName": "kops-alb-policy",
        "PolicyId": "ANPAIRIYZZZTCPJGNZZXS",
        "Arn": "arn:aws:iam::894527626897:policy/kops-alb-policy",
        "Path": "/",
        "DefaultVersionId": "v1",
        "AttachmentCount": 0,
        "PermissionsBoundaryUsageCount": 0,
        "IsAttachable": true,
        "CreateDate": "2019-01-18T03:50:00Z",
        "UpdateDate": "2019-01-18T03:50:00Z"
    }
}

aws iam attach-role-policy --policy-arn arn:aws:iam::894527626897:policy/kops-alb-policy --role-name nodes.k8s.techsquad.rocks
aws iam attach-group-policy --policy-arn arn:aws:iam::894527626897:policy/kops-alb-policy --group-name kops
{{< /highlight >}}


**Now we will also export or set the cluster name and kops state store as environment variables:**
{{< highlight bash >}}
export NAME=k8s.techsquad.rocks
export KOPS_STATE_STORE=techsquad-cluster-state-store
{{< /highlight >}}
We will be using these in a few places, so to not repeat ourselves let's better have it as variables.

**Create the zone for the subdomain in Route53:**
{{< highlight bash >}}
ID=$(uuidgen) && aws route53 create-hosted-zone --name ${NAME} --caller-reference $ID | jq .DelegationSet.NameServers

[
  "ns-848.awsdns-42.net",
  "ns-12.awsdns-01.com",
  "ns-1047.awsdns-02.org",
  "ns-1862.awsdns-40.co.uk"
]
{{< /highlight >}}
As I'm already using this domain for the blog with github we can create a subdomain for it and add some NS records in our root zone for that subdomain, in this case k8s.techsquad.rocks. To make this easier I will show you how it should look like:
{{< figure src="/img/kops-dns-subdomain.png" width="100%" >}}
So with this change and our new zone in Route53 for the subdomain, we can freely manage it like if it was another domain, this means that everything that goes to \*.k8s.techsquad.rocks will be handled by our Route53 zone.

**Create a bucket to store the cluster state:**
{{< highlight bash >}}
aws s3api create-bucket \
    --bucket ${KOPS_STATE_STORE} \
    --region us-east-1

{
    "Location": "/techsquad-cluster-state-store"
}
{{< /highlight >}}

**Set the versioning on, in case we need to rollback at some point:**
{{< highlight bash >}}
aws s3api put-bucket-versioning --bucket ${KOPS_STATE_STORE}  --versioning-configuration Status=Enabled
{{< /highlight >}}

**Set encryption on for the bucket:**
{{< highlight bash >}}
aws s3api put-bucket-encryption --bucket ${KOPS_STATE_STORE} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
{{< /highlight >}}

**This command will create our cluster:**
{{< highlight bash >}}
export KOPS_STATE_STORE="s3://${KOPS_STATE_STORE}"

kops create cluster \
    --zones us-east-1a \
    --networking calico \
    ${NAME} \
    --yes

I0117 23:14:06.449479   10314 create_cluster.go:1318] Using SSH public key: /home/kainlite/.ssh/id_rsa.pub
I0117 23:14:08.367862   10314 create_cluster.go:472] Inferred --cloud=aws from zone "us-east-1a"
I0117 23:14:09.736030   10314 subnets.go:184] Assigned CIDR 172.20.32.0/19 to subnet us-east-1a
W0117 23:14:18.049687   10314 firewall.go:249] Opening etcd port on masters for access from the nodes, for calico.  This is unsafe in untrusted environments.
I0117 23:14:19.385541   10314 executor.go:91] Tasks: 0 done / 77 total; 34 can run
I0117 23:14:21.779681   10314 vfs_castore.go:731] Issuing new certificate: "apiserver-aggregator-ca"
I0117 23:14:21.940026   10314 vfs_castore.go:731] Issuing new certificate: "ca"
I0117 23:14:24.404810   10314 executor.go:91] Tasks: 34 done / 77 total; 24 can run
I0117 23:14:26.548234   10314 vfs_castore.go:731] Issuing new certificate: "master"
I0117 23:14:26.689470   10314 vfs_castore.go:731] Issuing new certificate: "apiserver-aggregator"
I0117 23:14:26.766563   10314 vfs_castore.go:731] Issuing new certificate: "kube-scheduler"
I0117 23:14:26.863562   10314 vfs_castore.go:731] Issuing new certificate: "kube-controller-manager"
I0117 23:14:26.955776   10314 vfs_castore.go:731] Issuing new certificate: "kubecfg"
I0117 23:14:26.972837   10314 vfs_castore.go:731] Issuing new certificate: "apiserver-proxy-client"
I0117 23:14:26.973239   10314 vfs_castore.go:731] Issuing new certificate: "kops"
I0117 23:14:27.055466   10314 vfs_castore.go:731] Issuing new certificate: "kubelet"
I0117 23:14:27.127778   10314 vfs_castore.go:731] Issuing new certificate: "kubelet-api"
I0117 23:14:27.570516   10314 vfs_castore.go:731] Issuing new certificate: "kube-proxy"
I0117 23:14:29.503168   10314 executor.go:91] Tasks: 58 done / 77 total; 17 can run
I0117 23:14:31.594404   10314 executor.go:91] Tasks: 75 done / 77 total; 2 can run
I0117 23:14:33.297131   10314 executor.go:91] Tasks: 77 done / 77 total; 0 can run
I0117 23:14:33.297168   10314 dns.go:153] Pre-creating DNS records
I0117 23:14:34.947302   10314 update_cluster.go:291] Exporting kubecfg for cluster
kops has set your kubectl context to k8s.techsquad.rocks

Cluster is starting.  It should be ready in a few minutes.

Suggestions:
 * validate cluster: kops validate cluster
 * list nodes: kubectl get nodes --show-labels
 * ssh to the master: ssh -i ~/.ssh/id_rsa admin@api.k8s.techsquad.rocks
 * the admin user is specific to Debian. If not using Debian please use the appropriate user based on your OS.
 * read about installing addons at: https://github.com/kubernetes/kops/blob/master/docs/addons.md.
{{< /highlight >}}
We set the KOPS_STATE_STORE to a valid S3 url for kops, and then create the cluster, this will set kubectl context to our new cluster, we might need to wait a few minutes before being able to use it, but before doing anything let's validate that's up and ready.

{{< highlight bash >}}
kops validate cluster ${NAME}

Validating cluster k8s.techsquad.rocks

INSTANCE GROUPS
NAME                    ROLE    MACHINETYPE     MIN     MAX     SUBNETS
master-us-east-1a       Master  m3.medium       1       1       us-east-1a
nodes                   Node    t2.medium       2       2       us-east-1a

NODE STATUS
NAME                            ROLE    READY
ip-172-20-42-109.ec2.internal   node    True
ip-172-20-42-37.ec2.internal    master  True
ip-172-20-54-175.ec2.internal   node    True

Your cluster k8s.techsquad.rocks is ready
{{< /highlight >}}
The validation passed and we can see that our cluster is ready.

### **Aws-alb-ingress-controller**
We will use [Aws ALB Ingress Controller](https://aws.amazon.com/blogs/opensource/kubernetes-ingress-aws-alb-ingress-controller/), to serve our web traffic, this will create an manage an ALB based in our ingress rules.

{{< highlight bash >}}
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/rbac-role.yaml

clusterrole.rbac.authorization.k8s.io "alb-ingress-controller" created
clusterrolebinding.rbac.authorization.k8s.io "alb-ingress-controller" created
serviceaccount "alb-ingress" created
{{< /highlight >}}

Download the manifest and then modify the cluster-name to `k8s.techsquad.rocks`.
{{< highlight bash >}}
curl -sS "https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/alb-ingress-controller.yaml" > alb-ingress-controller.yaml
{{< /highlight >}}

Then finally apply it.
{{< highlight bash >}}
kubectl apply -f alb-ingress-controller.yaml

deployment.apps "alb-ingress-controller" created
{{< /highlight >}}

### **External-dns**
[External DNS](https://github.com/kubernetes-incubator/external-dns/blob/master/docs/tutorials/aws.md) will update our zone in Route53 based in the ingress rules as well, so everything will be done automatically for us once we add a deployment.

First we need to add some extra privileges, save this policy as a file, for example kops-route53-policy.json:
{{< highlight yaml >}}
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Effect": "Allow",
     "Action": [
       "route53:ChangeResourceRecordSets"
     ],
     "Resource": [
       "arn:aws:route53:::hostedzone/*"
     ]
   },
   {
     "Effect": "Allow",
     "Action": [
       "route53:ListHostedZones",
       "route53:ListResourceRecordSets"
     ],
     "Resource": [
       "*"
     ]
   }
 ]
}
{{< /highlight >}}

Then we need to create and attach the policy to our previously created group:
{{< highlight bash >}}
aws iam create-policy --policy-name kops-route53-policy --policy-document file://kops-route53-policy.json

{
    "Policy": {
        "PolicyName": "kops-route53-policy",
        "PolicyId": "ANPAIEWAGN62HBYC7QOS2",
        "Arn": "arn:aws:iam::894527626897:policy/kops-route53-policy",
        "Path": "/",
        "DefaultVersionId": "v1",
        "AttachmentCount": 0,
        "PermissionsBoundaryUsageCount": 0,
        "IsAttachable": true,
        "CreateDate": "2019-01-18T03:15:37Z",
        "UpdateDate": "2019-01-18T03:15:37Z"
    }
}

aws iam attach-group-policy --policy-arn arn:aws:iam::894527626897:policy/kops-route53-policy --group-name kops
aws iam attach-role-policy --policy-arn arn:aws:iam::894527626897:policy/kops-route53-policy --role-name nodes.k8s.techsquad.rocks
{{< /highlight >}}

We need to download the manifests and modify a few parameters to match our deployment, in this case the manifest are provided in the wiki, so I will copy it here with the parameter domain-filter updated, the rest is as is:
{{< highlight bash >}}

curl -Ss https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.1.0/docs/examples/external-dns.yaml > external-dns.yaml

{{< /highlight >}}
This configuration will only update records, that's the default policy (upsert), and it will only look for public hosted zones.

And apply it:
{{< highlight bash >}}
kubectl apply -f external-dns.yaml

serviceaccount "external-dns" unchanged
clusterrole.rbac.authorization.k8s.io "external-dns" configured
clusterrolebinding.rbac.authorization.k8s.io "external-dns-viewer" configured
deployment.extensions "external-dns" created
{{< /highlight >}}

Validate that we have everything that we installed up and running:
{{< highlight bash >}}
kubectl get pods

NAME                            READY     STATUS    RESTARTS   AGE
external-dns-7d7998f7bb-lb5kq   1/1       Running   0          2m

kubectl get pods -n kube-system

NAME                                                   READY     STATUS    RESTARTS   AGE
alb-ingress-controller-5885ddd5f9-9rsc8                1/1       Running   0          12m
calico-kube-controllers-f6bc47f75-n99tl                1/1       Running   0          27m
calico-node-4ps9c                                      2/2       Running   0          25m
calico-node-kjztv                                      2/2       Running   0          27m
calico-node-zs4fg                                      2/2       Running   0          25m
dns-controller-67f5c6b7bd-r67pl                        1/1       Running   0          27m
etcd-server-events-ip-172-20-42-37.ec2.internal        1/1       Running   0          26m
etcd-server-ip-172-20-42-37.ec2.internal               1/1       Running   0          26m
kube-apiserver-ip-172-20-42-37.ec2.internal            1/1       Running   0          27m
kube-controller-manager-ip-172-20-42-37.ec2.internal   1/1       Running   0          26m
kube-dns-756bfc7fdf-2kzjs                              3/3       Running   0          24m
kube-dns-756bfc7fdf-rq5nd                              3/3       Running   0          27m
kube-dns-autoscaler-787d59df8f-c2d52                   1/1       Running   0          27m
kube-proxy-ip-172-20-42-109.ec2.internal               1/1       Running   0          25m
kube-proxy-ip-172-20-42-37.ec2.internal                1/1       Running   0          26m
kube-proxy-ip-172-20-54-175.ec2.internal               1/1       Running   0          25m
kube-scheduler-ip-172-20-42-37.ec2.internal            1/1       Running   0          26m
{{< /highlight >}}
We can see that alb-ingress-controller is running, also external-dns, and everything looks good and healthy, time to test it with a deployment.

### **Testing everything**
{{< highlight bash >}}
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/2048/2048-namespace.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/2048/2048-deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/2048/2048-service.yaml

namespace "2048-game" created
deployment.extensions "2048-deployment" created
service "service-2048" created
{{< /highlight >}}

We need to download and edit the ingress resource to make it use our domain so we can then see the record pointing to the ELB/ALB.
{{< highlight bash >}}
curl -Ss https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/v1.0.0/docs/examples/2048/2048-ingress.yaml > 2048-ingress.yaml
{{< /highlight >}}

It should look something like this:
{{< highlight bash >}}
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: "2048-ingress"
  namespace: "2048-game"
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
  labels:
    app: 2048-ingress
spec:
  rules:
  - host: 2048.k8s.techsquad.rocks
    http:
      paths:
      - backend:
          serviceName: "service-2048"
          servicePort: 80
        path: /*
{{< /highlight >}}

And apply it:
{{< highlight bash >}}
kubectl apply -f 2048-ingress.yaml

ingress.extensions "2048-ingress" created
{{< /highlight >}}
Wait a few moments and verify.

### **Clean up**
Remember this is not free, and if you don't want to get charged for something that you are not going to use, shutdown and delete everything.
{{< highlight bash >}}
kops delete cluster ${NAME} --yes

...
Deleted kubectl config for k8s.techsquad.rocks

Deleted cluster: "k8s.techsquad.rocks"
{{< /highlight >}}

### **Notes**
* I was going to use helm and deploy a more complex application here, but the article was already too long, so I decided to go with the aws alb ingress controller example.
* If something doesn't go well or things aren't happening you can always check the logs for external-dns and aws-alb-ingress-controller, the messages are usually very descriptive and easy to understand.
* Even that the ingress controller is called ALB Ingress Controller, it does creates also regular ELBs if you don't annotate the ingress resource with `kubernetes.io/ingress.class: alb`
* If you are going to use ALBs, have in mind that it will create an ALB for each deployment, there is a small project that merges everything into one ALB but you have to have a unified or consolidated way to do health checks or the ALB will get false positives and return 502 errors once in a while, the project can be found [here](https://github.com/jakubkulhan/ingress-merge).

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
