# @jpwilliams/sennen-code-test

I was going to publish this on NPM so you could run it using `npx`, but I don't want to get caught out not being able to unpublish it afterwards!

Thus, please clone the repo, build it, link it, and run locally.

``` sh
git clone https://github.com/jpwilliams/sennen-code-test
cd sennen-code-test
npm ci
npm run build
npm link
sennen-code-test --help
```

``` sh
Usage: sennen-code-test [options]

Options:
  -c, --count <number>  number of data points to generate (default: "100")
  -p, --print           print out raw data points
  -r, --repo            go to the GitHub code repository
  -g, --github          go to my GitHub profile
  -l, --linkedin        go to my LinkedIn profile
  -h, --help            display help for command
```

If, for whatever reason, linking isn't working, running `sennen-code-test` is equivalent to `node lib/index.js`.

Tests can be run using `npm run test`.

## Thoughts

Really interesting exercise! I decided to go with making a CLI to avoid the extraneous complications (and boilerplate) of something like an HTTP API. Furthermore, it's nice and easy to run for everyone, which is hopefully a plus.

It's worth mentioning that some of the code is over-commented so as to help explain my thought process when implementing different parts of the process. As well as that, there's no Git history for this particular repo due to the transient nature of it, but other repos should provide good examples of usual commits.

I didn't get a chance to use Ramda, unfortunately, as I couldn't immediately see any sensible places for its implementation here, though I presume that I'd find many the application after some persistent use of it.

Finally, it would probably be sensible in many situations here (such as the rate limiting) to use popular open-source packages/libraries. However, because this is a coding exercise I didn't just want to `npm install` and call it a day, so there aren't many packages used here outside of CLI helpers.

## Structure guidance

The main logic of the app sits in `src/index.ts`. For any larger or sustainable app this would be split up moved somewhere more extensible, but for the purposes of this exercise it seemed sensible to not over-complicate things. Ergo, the vast majority of that file deals with parsing CLI input and providing pretty output.

The `external` folder contains outward-facing APIs (in this case, the Sunrise/Sunset API).

The `types` folder contains any types used in multiple places throughout the app.

The `utils` folder contains any generic utilities that could be re-used in multiple places throughout the app.

## Caveats

The unit testing here is exceedingly light and there's no holistic testing; I didn't want to spend too long testing every code branch, so the unit testing here is instead more sparse, showing how they're organised and run instead of providing 100% test coverage.
