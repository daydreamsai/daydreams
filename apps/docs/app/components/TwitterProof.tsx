"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

// Mock tweet data - replace with real tweets from an API in production
const tweets = [
  {
    id: "1",
    author: "Jane Doe",
    handle: "@janedoe",
    avatar: "/avatars/user1.png",
    content:
      "Daydreams is a game changer for building AI agents! Finally a framework that makes sense.",
    date: "2h ago",
    likes: 42,
    verified: true,
  },
  {
    id: "2",
    author: "John Smith",
    handle: "@johnsmith",
    avatar: "/avatars/user2.png",
    content:
      "Just shipped my first autonomous agent with @daydreamsagents. The type-safety and modular architecture is *chef's kiss*",
    date: "5h ago",
    likes: 128,
    verified: false,
  },
  {
    id: "3",
    author: "Alice Johnson",
    handle: "@alicejohnson",
    avatar: "/avatars/user3.png",
    content:
      "I built an autonomous trading agent in a weekend with Daydreams. The memory system is incredible.",
    date: "1d ago",
    likes: 87,
    verified: true,
  },
  {
    id: "4",
    author: "Bob Brown",
    handle: "@bobbrown",
    avatar: "/avatars/user4.png",
    content:
      "Switching our entire agent infrastructure to @daydreamsagents saved us months of development time. Highly recommend!",
    date: "2d ago",
    likes: 231,
    verified: true,
  },
  {
    id: "5",
    author: "Carol White",
    handle: "@carolwhite",
    avatar: "/avatars/user5.png",
    content:
      "The context system in Daydreams is genius. Our agents now have perfect memory and state management.",
    date: "3d ago",
    likes: 64,
    verified: false,
  },
  {
    id: "6",
    author: "Dave Green",
    handle: "@davegreen",
    avatar: "/avatars/user6.png",
    content:
      "After trying every agent framework out there, Daydreams is by far the most developer-friendly. The TypeScript integration is *perfect*.",
    date: "4d ago",
    likes: 157,
    verified: true,
  },
  {
    id: "7",
    author: "Tech Influencer",
    handle: "@techinfluencer",
    avatar: "/avatars/user7.png",
    content:
      "Daydreams is doing for autonomous agents what React did for frontend. A true paradigm shift.",
    date: "5d ago",
    likes: 432,
    verified: true,
  },
  {
    id: "8",
    author: "AI Builder",
    handle: "@aibuilder",
    avatar: "/avatars/user8.png",
    content:
      "In a sea of agent frameworks, @daydreamsagents stands out with its clean API, excellent docs, and thoughtful abstractions.",
    date: "6d ago",
    likes: 197,
    verified: false,
  },
];

// Tweet component to display a single tweet
function Tweet({ tweet }: { tweet: (typeof tweets)[0] }) {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 w-80 shadow-xl min-w-80 flex-shrink-0 transform transition-all hover:scale-105 hover:border-purple-500/50 hover:shadow-purple-500/20 hover:shadow-lg">
      <div className="flex items-start mb-3">
        <div className="w-10 h-10 rounded-full bg-purple-800 flex-shrink-0 overflow-hidden relative">
          {/* Fallback colored circle if avatar is missing */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
            {tweet.author.charAt(0)}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <p className="font-semibold text-white">{tweet.author}</p>
            {tweet.verified && (
              <svg
                className="w-4 h-4 ml-1 text-blue-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
          </div>
          <p className="text-white/60 text-sm">{tweet.handle}</p>
        </div>
        <div className="text-white/40 text-xs self-start">{tweet.date}</div>
      </div>
      <p className="text-white/90 mb-3 text-sm">{tweet.content}</p>
      <div className="flex items-center text-white/50 text-xs">
        <svg
          className="w-4 h-4 mr-1 text-red-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
        </svg>
        <span>{tweet.likes}</span>
      </div>
    </div>
  );
}

export default function TwitterProof() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollerRef.current;
    if (!scrollContainer) return;

    // Clone tweets for infinite scrolling effect
    const clonedTweets = Array.from(scrollContainer.children);
    clonedTweets.forEach((tweet) => {
      const clone = tweet.cloneNode(true);
      scrollContainer.appendChild(clone);
    });

    // Animation for scrolling
    const scrollAnimation = () => {
      if (!scrollContainer) return;

      // Increment scroll position
      scrollContainer.scrollLeft += 1;

      // Reset scroll position when we've scrolled through the first set of tweets
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
        scrollContainer.scrollLeft = 0;
      }

      // Continue the animation
      requestAnimationFrame(scrollAnimation);
    };

    // Start the animation
    const animationId = requestAnimationFrame(scrollAnimation);

    // Cleanup
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Pause scroll on hover
  const handleMouseEnter = () => {
    const scrollContainer = scrollerRef.current;
    if (scrollContainer) {
      scrollContainer.style.animationPlayState = "paused";
    }
  };

  const handleMouseLeave = () => {
    const scrollContainer = scrollerRef.current;
    if (scrollContainer) {
      scrollContainer.style.animationPlayState = "running";
    }
  };

  return (
    <div className="border-x border-t py-12 relative overflow-hidden">
      {/* <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5" /> */}

      <h2 className="text-center text-2xl font-semibold mb-2 text-white relative z-10">
        <span className="text-white px-2 py-1">
          _{">"} What People Are Saying
        </span>
      </h2>
      <p className="text-center text-white/70 mb-8 relative z-10 max-w-2xl mx-auto">
        Join the growing community of developers building with Daydreams
      </p>

      {/* Twitter stream */}
      <div className="relative max-w-full mx-auto">
        {/* Gradient masks for smooth fade effect */}
        {/* <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-black to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-black to-transparent"></div> */}

        {/* Scrolling container */}
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-scroll no-scrollbar py-4 px-12"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ scrollBehavior: "smooth" }}
        >
          {tweets.map((tweet) => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))}
        </div>
      </div>

      {/* CSS for hiding scrollbar */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}
