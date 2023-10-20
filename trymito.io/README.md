This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, make sure you have the node modules installed by running: `npm install`

Then run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Codebase structure

#### Mobile First
The structure of the codebase is mobile first! Specifically, if you removed all of the css code inside of the media queries, you'd be left with a mobile-only website. This approach worked well because basic, non-formatted HTML is mobile friendly, so if we designed the desktop version first, actually, we are adding css that makes the website non-mobile friendly, and then in the media queries, we're remaking it mobile friendly. Its a waste of code. 

## Developing on for mobile

Although browsers have mobile emulators built into their developer tools, they are not 100% accurate. To make developing on mobile easier, connect your iphone to your computer's local host so you can see live updates without deploying the website and checking on mobile. 

To do so, follow these steps (steps from: https://mtm.dev/iphone-localhost-mac)

1. Open System Preferences > Sharing.
2. Select Internet Sharing in the left tab. This should show your internet sharing controls on the right.
3. If the checkbox next to Internet Sharing is enabled, **uncheck it**.
4. On the right side of your Internet Sharing options, check iPhone USB.
5. Enable Internet Sharing by checking its checkbox. There may be a popup that asks you to confirm this action.
6. Find the message near the top that says, "Computers on your local network can access your computer at: xxxx.local. Make a note of what xxxx says – this is your computer's name. You'll be typing it into your address bar, so I recommend editing it into a short word.
7. Depending on your server settings, you might now be able to access your localhost server from xxxx.local:yyyy, where xxxx is your name from the previous step and yyyy is your server's port number. For instance, myname.local:3000. However, you might need to do one more thing before you can connect to your local server.

