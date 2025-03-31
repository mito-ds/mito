/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from "next/image"
import tweetsStyles from './Tweets.module.css'
import CodingMuffinTwitterProfilePicture from '../../public/twitter/CodingMuffinTwitterProfilePicture.png'
import EbehiTwitterProfilePicture from '../../public/twitter/EbehiTwitterProfilePicture.png'
import PhilipVolletTwitterProfilePicture from '../../public/twitter/PhilipVolletTwitterProfilePicture.png'
import IsaacTwitterProfilePicture from '../../public/twitter/IsaacTwitterProfilePicture.png'
import RobTwitterProfilePicture from '../../public/twitter/RobTwitterProfilePicture.png'
import UnkownTwitterProfilePicture from '../../public/twitter/UnkownTwitterProfilePicture.png'
import PaigeTwitterProfilePicture from '../../public/twitter/PaigeTwitterProfilePicture.png'

import TwitterLogo from '../../public/TwitterLogo.png'
import { useState } from "react"
import Marquee from "../Marquee/Marquee"

interface Tweet  {
    imageSrc: StaticImageData,
    username: string,
    handle: string,
    text: JSX.Element 
}

const tweetData: Tweet[] = [
    {
        imageSrc: CodingMuffinTwitterProfilePicture,
        username: 'Coding Muffin',
        handle: '@codingmuffin',
        text: <p>Have been playing with <span className='text-twitter-blue'>#mitosheet</span> for my <span className='text-twitter-blue'>#python</span> data science project. <b className='text-primary'>Saved so much time with it!</b> Now I just wonder why this is not a default for python environments... 😂</p>
    }, 
    {
        imageSrc: EbehiTwitterProfilePicture,
        username: 'Ebehi',
        handle: '@Ebehi_Iyoha',
        text: <p>More exciting stuff for python newbies and regulars. Mito allows you to edit your data like you would in excel, and automatically generates the equivalent python code for replicability. <b className='text-primary'>Really lowers the barrier to entry!</b></p>
    }, 
    {
        imageSrc: PhilipVolletTwitterProfilePicture,
        username: 'Philip Vollet',
        handle: '@philipvollet',
        text: <p> Create graphs and charts that are automatically turned into code with Mito. You can also do full data cleaning and Exploratory Data Analysis (EDA), and <b className='text-primary'>Mito will generate the equivalent Python for each edit you make</b>.</p>
    },
    {
        imageSrc: PaigeTwitterProfilePicture,
        username: '👩‍💻 Paige Bailey #BlackLivesMatter',
        handle: '@DynamicWebPaige',
        text: <p>😮 <b className='text-primary'>Oh, wow - this is also rad</b>: make changes to a spreadsheet with <span className='text-twitter-blue'>@TryMito</span>, and generate Python equivalent functions:</p>
    },
    {
        imageSrc: IsaacTwitterProfilePicture,
        username: 'Isaac🚀',
        handle: '@isaacayz',
        text: <p>Okay, just learning about <span className='text-twitter-blue'>#mitosheet</span> and I must say <b className='text-primary'>that library is SICK!</b> 😲 </p>
    },
    {
        imageSrc: RobTwitterProfilePicture,
        username: 'Rob Riedlinger',
        handle: '@creativerob',
        text: <p><b className='text-primary'>Just had my mind blown</b> by <span className='text-twitter-blue'>@tryMito</span>. What an incredible product! <span className='text-twitter-blue'> #DataAnalytics #DataScience </span> Like its name suggests... Mito is going to empower the data world as we know it.</p>
    },
    {
        imageSrc: UnkownTwitterProfilePicture,
        username: 'Matt Blome',
        handle: '@mattblome',
        text: <p><b className='text-primary'>You guys are implementing new and useful features at lightning speed!</b> So glad to have the opportunity to work with you all, keep up the good work!!</p>
    },   
]


const Tweets = (): JSX.Element => {
    const [tweetsForMobile, setTweetsForMobile] = useState<Tweet[]>(tweetData)

    setTimeout(() => {
        const newTweetsOrder = [...tweetsForMobile]
        const firstTweet = newTweetsOrder.shift();
        if (firstTweet !== undefined) {
            newTweetsOrder.push(firstTweet);
        }
        setTweetsForMobile(newTweetsOrder)
    }, 8000);
        
    return (
        <>
            {/* 
                First we handle mobile. Since there is not enough space to horizontally scroll 
                tweets across the page while making the text easily readable, we display one tweet at a time, 
                and flash update the tweet every 8 seconds. 
            */}
            <div className={tweetsStyles.tweets_container + ' only-on-mobile'}>
                {tweetsForMobile.map((tweet, idx) => {
                    // In mobile, we only show 1 tweet at a time. To hide the other tweets, 
                    // we just say to only display them if we're in desktop mode!
                    const displayClass = idx !== 1 ? ' only-on-desktop-inline-block' : ''
                    return (
                        <div className={tweetsStyles.tweet_container + displayClass} key={tweet.handle}>
                            <div className={tweetsStyles.tweet_card}>
                                <div className={tweetsStyles.tweet_header}>
                                    <div className={tweetsStyles.tweet_header_left}>
                                        <div className='vertical-center'>
                                            <Image
                                                src={tweet.imageSrc}
                                                height={40}
                                                width={40}
                                                alt='twitter profile picture'
                                            />
                                        </div>
                                        <div>
                                            <p className={tweetsStyles.tweet_username}>
                                                {tweet.username}
                                            </p>
                                            <p>
                                                {tweet.handle}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <Image
                                            src={TwitterLogo}
                                            alt='twitter logo'
                                            height={20}
                                            width={25}
                                        />
                                    </div>
                                </div>
                                <div>
                                    {tweet.text}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 
                Then we handle Desktop. In Desktop mode, we display the tweets in a horizontally
                scrolling marquee.
            */}
            <Marquee className={'display-desktop-only-flex'}>
                {tweetData.map((tweet, idx) => {
                    return (
                        <div className={tweetsStyles.tweet_card} key={tweet.handle}>
                            <div className={tweetsStyles.tweet_header}>
                                <div className={tweetsStyles.tweet_header_left}>
                                    <div className='vertical-center'>
                                        <Image
                                            src={tweet.imageSrc}
                                            height={40}
                                            width={40}
                                            alt='twitter profile picture'
                                        />
                                    </div>
                                    <div>
                                        <p className={tweetsStyles.tweet_username}>
                                            {tweet.username}
                                        </p>
                                        <p>
                                            {tweet.handle}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <Image
                                        src={TwitterLogo}
                                        alt='twitter logo'
                                        height={20}
                                        width={25}
                                    />
                                </div>
                            </div>
                            <div>
                                {tweet.text}
                            </div>
                        </div>
                    )
                })}
            </Marquee>
        
        </>
        
    )
}


export default Tweets;