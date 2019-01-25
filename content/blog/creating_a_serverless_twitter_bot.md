---
author: "Gabriel Garrido"
date: 2019-01-22
linktitle: How to create a serverless twitter bot
title: How to create a serverless twitter bot
highlight: true
tags:
- go
- aws
- serverless
categories:
- serverless
lua:
  image:
    url: "/img/logo.png"
---

### **Introduction**
This article explains how to create a serverless tweet-bot, basically pulls articles from this blog and post them to twitter in a nice way. It uses cron as the trigger so it should post a tweet every 12 hours, or you can invoke it manually.

### **Twitter**
So before you can start with the Twitter API you need to get a developer account in [this url](https://developer.twitter.com/en/apply/user), after submitted and created, you then need to create an App and generate the keys and tokens to be able to use it, it might take a while, I recommend you read everything that Twitter wants you to read while creating both the dev account and the app, so you can understand the scope and the good practices of using their services.


### **The code**
I added several comments over the code so it's easy to understand what everything is supposed to do, also it can be found [here](https://github.com/kainlite/tbo).
{{< highlight go >}}
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/dghubble/go-twitter/twitter"
	"github.com/dghubble/oauth1"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
)

// Version
var Version string

// Environment
var Env string

// Page JSON object
type Page struct {
	Version  string    `json:"version"`
	Title    string    `json:"title"`
	BaseURL  string    `json:"home_page_url"`
	FeedURL  string    `json:"feed_url"`
	Articles []Article `json:"items"`
}

// Article JSON object
type Article struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Title     string `json:"title"`
	Content   string `json:"content_html"`
	Published string `json:"date_published"`
}

// Twitter Access
type Twitter struct {
	config      *oauth1.Config
	token       *oauth1.Token
	httpClient  *http.Client
	client      *twitter.Client
	tweetFormat string
	screenName  string
}

// This functions grabs all the necessary bits to connect to the Twitter API.
func (t *Twitter) Setup() {
	log.Debug("Setting up twitter client")
	var twitterAccessKey string
	var twitterAccessSecret string
	var twitterConsumerKey string
	var twitterConsumerSecret string

	// Get the access keys from ENV
	twitterAccessKey = os.Getenv("TWITTER_ACCESS_KEY")
	twitterAccessSecret = os.Getenv("TWITTER_ACCESS_SECRET")
	twitterConsumerKey = os.Getenv("TWITTER_CONSUMER_KEY")
	twitterConsumerSecret = os.Getenv("TWITTER_CONSUMER_SECRET")
	twitterScreenName := os.Getenv("TWITTER_SCREEN_NAME")

	if twitterScreenName == "" {
		log.Fatalf("Twitter screen name cannot be null")
	}

	if twitterConsumerKey == "" {
		log.Fatal("Twitter consumer key can not be null")
	}

	if twitterConsumerSecret == "" {
		log.Fatal("Twitter consumer secret can not be null")
	}

	if twitterAccessKey == "" {
		log.Fatal("Twitter access key can not be null")
	}

	if twitterAccessSecret == "" {
		log.Fatal("Twitter access secret can not be null")
	}

	log.Debug("Setting up oAuth for twitter")
	// Setup the new oauth client
	t.config = oauth1.NewConfig(twitterConsumerKey, twitterConsumerSecret)
	t.token = oauth1.NewToken(twitterAccessKey, twitterAccessSecret)
	t.httpClient = t.config.Client(oauth1.NoContext, t.token)

	// Twitter client
	t.client = twitter.NewClient(t.httpClient)

	// Set the screen name for later use
	t.screenName = twitterScreenName

	// This is the format of the tweet
	t.tweetFormat = "%s: %s - TBO"
	log.Debug("Twitter client setup complete")
}

// Format tweets
func (t *Twitter) GetTweetString(article Article) string {
	return fmt.Sprintf(t.tweetFormat, article.Title, article.URL)
}

// Send the tweet
func (t *Twitter) Send(article Article) {
	log.Debug("Sending tweet")
	if Env != "production" {
		log.Infof("Non production mode, would've tweeted: %s", t.GetTweetString(article))
	}
	if Env == "production" {
		log.Infof("Sending tweet: %s", t.GetTweetString(article))
		if _, _, err := t.client.Statuses.Update(t.GetTweetString(article), nil); err != nil {
			log.Fatalf("Error sending tweet to twitter: %s", err)
		}
	}
}

// Get a random article from the feed
// This functions checks that the same tweet is not present
// in the last 30 tweets
func (t *Twitter) PickArticle(article Article) bool {
	log.Debug("Checking to see if the tweet appeared in the last 30 tweets")

	tweets, _, err := t.client.Timelines.UserTimeline(&twitter.UserTimelineParams{
		ScreenName: t.screenName,
		Count:      30,
		TweetMode:  "extended",
	})

	if err != nil {
		log.Fatalf("Error getting last 30 tweets from user: %s", err)
	}

	for _, tweet := range tweets {
		if strings.Contains(tweet.Text, t.GetTweetString(article)) {
			return true
		}
	}

	return false
}

// Twitter API constant
var tw Twitter

// This function is rather large, but basically grabs the a big json from
// the jsonfeed url and tests several tweets until it finds one that it's valid
// a tweet could be invalid if for example it was already tweeted in the last 30 tweets
func GetArticle() Article {
	url := "https://techsquad.rocks/index.json"

	// Setup a new HTTP Client with 3 seconds timeout
	httpClient := http.Client{
		Timeout: time.Second * 3,
	}

	// Create a new HTTP Request
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		// An error has occurred that we can't recover from, bail.
		log.Fatalf("Error occurred creating new request: %s", err)
	}

	// Set the user agent to tbo <version> - twitter.com/kainlite
	req.Header.Set("User-Agent", fmt.Sprintf("TBO %s - twitter.com/kainlite", Version))

	// Tell the remote server to send us JSON
	req.Header.Set("Accept", "application/json")

	// We're only going to try maxTries times, otherwise we'll fatal out.
	// Execute the request
	log.Debugf("Attempting request to %s", req)
	res, getErr := httpClient.Do(req)
	if getErr != nil {
		// We got an error, lets bail out, we can't do anything more
		log.Fatalf("Error occurred retrieving article from API: %s", getErr)
	}

	// BGet the body from the result
	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		// This shouldn't happen, but if it does, error out.
		log.Fatalf("Error occurred reading from result body: %s", readErr)
	}

	// Parse json into the struct Page
	var page Page
	if err := json.Unmarshal(body, &page); err != nil {
		// Invalid JSON was received, bail out
		log.Fatalf("Error occurred decoding article: %s", err)
	}

	invalidArticle := true
	try := 0
	maxTries := 10

	// Attempt to get a valid article for the next tweet
	var article Article
	for invalidArticle {
		rand.Seed(time.Now().UnixNano())
		randomInt := rand.Intn(len(page.Articles))
		article = page.Articles[randomInt]

		fmt.Printf("%+v", randomInt)
		// check to make sure the tweet hasn't been sent before
		if tw.PickArticle(article) {
			try += 1
			continue
		}

		// If we get here we've found a tweet, exit the loop
		invalidArticle = false

		if try >= maxTries {
			log.Fatal("Exiting after attempts to retrieve article failed.")

		}
	}

	// Return the valid article response
	return article
}

// HandleRequest - Handle the incoming Lambda request
func HandleRequest() {
	log.Debug("Started handling request")
	tw.Setup()
	article := GetArticle()

	// Send tweet
	tw.Send(article)
}

// Set the local environment
func setRunningEnvironment() {
	// Get the environment variable
	switch os.Getenv("APP_ENV") {
	case "production":
		Env = "production"
	case "development":
		Env = "development"
	default:
		Env = "development"
	}

	if Env != "production" {
		Version = Env
	}
}

func shutdown() {
	log.Info("Shutdown request registered")
}

func init() {
	// Set the environment
	setRunningEnvironment()

	// Set logging configuration
	log.SetFormatter(&log.TextFormatter{
		DisableColors: true,
		FullTimestamp: true,
	})

	log.SetReportCaller(true)
	switch Env {
	case "development":
		log.SetLevel(log.DebugLevel)
	case "production":
		log.SetLevel(log.ErrorLevel)
	default:
		log.SetLevel(log.InfoLevel)
	}
}

func main() {
	// Start the bot
	log.Debug("Starting main")
	log.Printf("TBO %s", Version)

	if Env == "production" {
		lambda.Start(HandleRequest)
	} else {
		// this environment variables are used locally while debugging, it can be quite handy
		if err := godotenv.Load(); err != nil {
			log.Fatal("Error loading .env file")
		}
		HandleRequest()
	}
}
{{< /highlight >}}
The code is fairly straigth forward, it checks for the environment to have a locally runable/debuggable app if it's development or if it's running as an AWS Function in production.

### **While debugging locally it can be ran like this**
You can save use an .env file to test debug how your tweets are going to look.
{{< highlight bash >}}
go run .
# OUTPUT:
# time="2019-01-21T22:39:15-03:00" level=debug msg="Starting main" func=main.main file="/home/kainlite/Webs/tbo/tbo/main.go:279"
# time="2019-01-21T22:39:15-03:00" level=info msg="TBO development" func=main.main file="/home/kainlite/Webs/tbo/tbo/main.go:280"
# time="2019-01-21T22:39:15-03:00" level=debug msg="Started handling request" func=main.HandleRequest file="/home/kainlite/Webs/tbo/tbo/main.go:225"
# time="2019-01-21T22:39:15-03:00" level=debug msg="Setting up twitter client" func="main.(*Twitter).Setup" file="/home/kainlite/Webs/tbo/tbo/main.go:55"
# time="2019-01-21T22:39:15-03:00" level=debug msg="Setting up oAuth for twitter" func="main.(*Twitter).Setup" file="/home/kainlite/Webs/tbo/tbo/main.go:88"
# time="2019-01-21T22:39:15-03:00" level=debug msg="Twitter client setup complete" func="main.(*Twitter).Setup" file="/home/kainlite/Webs/tbo/tbo/main.go:102"
# time="2019-01-21T22:39:15-03:00" level=debug msg="Attempting request to &{GET https://techsquad.rocks/index.json HTTP/1.1 %!s(int=1) %!s(int=1) map[User-Agent:[TBO development - twitter.com/kainlite] Accept:[application/json]] <nil> %!s(func() (io.ReadCloser, error)=<nil>) %!s(int64=0) [] %!s(bool=false) techsquad.rocks map[] map[] %!s(*multipart.Form=<nil>) map[]   %!s(*tls.ConnectionState=<nil>) %!s(<-chan struct {}=<nil>) %!s(*http.Response=<nil>) <nil>}" func=main.GetArticle file="/home/kainlite/Webs/tbo/tbo/main.go:173"
# 4time="2019-01-21T22:39:15-03:00" level=debug msg="Checking to see if the tweet appeared in the last 30 tweets" func="main.(*Twitter).PickArticle" file="/home/kainlite/Webs/tbo/tbo/main.go:125"
# time="2019-01-21T22:39:16-03:00" level=debug msg="Sending tweet" func="main.(*Twitter).Send" file="/home/kainlite/Webs/tbo/tbo/main.go:111"
# time="2019-01-21T22:39:16-03:00" level=info msg="Non production mode, would've tweeted: Getting started with skaffold: https://techsquad.rocks/blog/getting_started_with_skaffold/ - TBO" func="main.(*Twitter).Send" file="/home/kainlite/Webs/tbo/tbo/main.go:113"
{{< /highlight >}}
The output is very verbose but it will show you everything that the function will do.

### **Creating the project**
But how did you get the project skeleton?
{{< highlight bash >}}
mkdir tbo && cd tbo && serverless create -t aws-go
{{< /highlight >}}
By default it creates two go functions: hello and world, if you look at the files serverless.yaml and the go code, it will be easy to understand how everything is tied together in the default example.

### **Serverless framework**
This function is managed by the [serverless framework](https://serverless.com/), as you can see it's an easy way to manage your functions, what this small block of YAML will do is compile, upload, and schedule our function (because we use an event schedule)
{{< highlight bash >}}
# Welcome to Serverless!
#
# This file is the main config file for your service.
# It's very minimal at this point and uses default values.
# You can always add more config options for more control.
# We've included some commented out config examples here.
# Just uncomment any of them to get that config option.
#
# For full config options, check the docs:
#    docs.serverless.com
#
# Happy Coding!

service: handler

# You can pin your service to only deploy with a specific Serverless version
# Check out our docs for more details
# frameworkVersion: "=X.X.X"
frameworkVersion: ">=1.28.0 <2.0.0"

provider:
  name: aws
  runtime: go1.x
  region: ${env:AWS_DEFAULT_REGION, 'us-east-1'}
  stage: ${env:TBO_BUILD_STAGE, 'prod'}
  memorySize: 128
  versionFunctions: false

package:
 exclude:
   - ./**
 include:
   - ./tbo/tbo

functions:
  tweet:
    handler: tbo/tbo
    events:
      - schedule: cron(0 */12 * * ? *)
    environment:
      APP_ENV: "production"
      TWITTER_SCREEN_NAME: "twitter_username"
      TWITTER_CONSUMER_KEY: "example_key"
      TWITTER_CONSUMER_SECRET: "example_secret"
      TWITTER_ACCESS_KEY: "example_key"
      TWITTER_ACCESS_SECRET: "example_secret"
{{< /highlight >}}
We provide the environment variables there that the app needs to run, under the hood what serverless will do is create an s3 bucket for this function with a cloudformation stack and a zip file with your function (for each version or deployment), then it will apply that that stack and validate that everything went ok.

### **Deploy the function**
Once the code is ready and you are ready to test it in production aka send a real tweet, just deploy it.
{{< highlight bash >}}
serverless deploy
# OUTPUT:
# Serverless: WARNING: Missing "tenant" and "app" properties in serverless.yml. Without these properties, you can not publish the service to the Serverless Platform.
# Serverless: Packaging service...
# Serverless: Excluding development dependencies...
# Serverless: Uploading CloudFormation file to S3...
# Serverless: Uploading artifacts...
# Serverless: Uploading service .zip file to S3 (9.86 MB)...
# Serverless: Validating template...
# Serverless: Updating Stack...
# Serverless: Checking Stack update progress...
# ..................
# Serverless: Stack update finished...
# Service Information
# service: handler
# stage: prod
# region: us-east-1
# stack: handler-prod
# api keys:
#   None
# endpoints:
#   None
# functions:
#   tweet: handler-prod-tweet
# layers:
#   None
{{< /highlight >}}
As we described before you can see everything that the serverless framework did for us, nothing really hard to remember and everything automated.

### **S3**
Example s3 bucket from the previous deployment.
{{< highlight bash >}}
aws s3 ls
# OUTPUT:
# 2019-01-21 22:42:05 handler-prod-serverlessdeploymentbucket-1s5fs5igk2pwc
{{< /highlight >}}
As we can see after the deployment we see a new bucket with our function and if we take a look at the files we will find several (depending on how many deployments you do) stacks/manifests and the zip file with our function for each version/deployment.

### **Invoke the function**
Ok, but I don't want to wait 12 hours to see if everything is okay, then just invoke the function.
{{< highlight bash >}}
serverless invoke -f tweet
# OUTPUT:
# null
{{< /highlight >}}
Wait, where did tweet came from?, if you look at the serverless manifest you will see that our function is called tweet. If everything went well you will be able to see that tweet in your profile, something like this:
{{< figure src="/img/twitter-tbo.png" class="zoom" width="100%" >}}

### Notes
* Why TBO, what's tbo? bot misspelled.
* The Serverless framework is really cool and works in a variety of environments, I certainly recommend taking a look and at least trying it, I use it for a few small projects and it eases my life a lot.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
