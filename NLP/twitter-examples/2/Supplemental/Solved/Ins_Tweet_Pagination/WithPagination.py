# Dependencies
import tweepy
import json

# Twitter API Keys
consumer_key = "Ed4RNulN1lp7AbOooHa9STCoU"
consumer_secret = "P7cUJlmJZq0VaCY0Jg7COliwQqzK0qYEyUF9Y0idx4ujb3ZlW5"
access_token = "839621358724198402-dzdOsx2WWHrSuBwyNUiqSEnTivHozAZ"
access_token_secret = "dCZ80uNRbFDjxdU2EckmNiSckdoATach6Q8zb7YYYE5ER"

# Setup Tweepy API Authentication
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
api = tweepy.API(auth, parser=tweepy.parsers.JSONParser())

# Target User
target_user = "GuardianData"

# Tweet Texts
tweet_texts = []

# Create a loop to iteratively run API requests
for x in range(10):

    # Get all tweets from home feed (for each page specified)
    public_tweets = api.user_timeline(target_user, page=x)

    # Loop through all tweets
    for tweet in public_tweets:

        # Print Tweet
        print(tweet["text"])

        # Store Tweet in Array
        tweet_texts.append(tweet["text"])

# Print the Tweet Count
print("Tweet Count: %s" % len(tweet_texts))
