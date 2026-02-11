/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */


import React, { useState } from 'react';


const MatchComponent = ({ isViewMatch = false }) => {
  const [currentPickupLine, setCurrentPickupLine] = useState(0);
  
  const pickupLines = [
    "You must be a dataset, because I keep finding new things I like about you.",
    "Are you a histogram? Because you've got me seeing the distribution of my feelings.",
    "Even without labels, I'd still classify you as awesome.",
    "Let's build something together — no need to split this train-test relationship.",
    "You make my heart beat faster than a for-loop in Python.",
    "You're like clean data — rare and incredibly valuable.",
    "Can we cluster together? I think we belong in the same group.",
    "Are you one-hot encoded? Because you're the only one I notice.",
    "You've got more charm than a well-tuned random forest.",
    "You must be a linear model — because everything makes sense when you're around.",
    "Are we running PCA? Because you just reduced the noise in my day.",
    "Even if we were randomly sampled, I'd still choose you every time.",
    "You make my confidence interval spike.",
    "You're like a good visualization — you make everything clearer.",
    "I'd never drop you from the dataset — you're too important.",
    "I think you're my optimal hyperparameter setting.",
    "Talking to you feels better than a perfect F1 score.",
    "Are you a neural network? Because you've got layers I want to understand.",
    "Let's not overfit this — but I think we've got a good thing going.",
    "You're like an unsupervised model — I didn't expect you, but now I can't stop thinking about you."
  ];

  const getRandomPickupLine = () => {
    const randomIndex = Math.floor(Math.random() * pickupLines.length);
    setCurrentPickupLine(randomIndex);
  };

  return (
    <div className="w-full min-h-[400px] bg-gradient-to-br from-valentine-light via-white to-valentine-lightPink rounded-2xl shadow-lg overflow-hidden">
      {/* Hero Image Section */}
      <div className="w-full h-48 bg-gradient-to-r from-valentine-pink to-valentine-red relative overflow-hidden">
        <div className={`absolute inset-0 
        ${!isViewMatch ? "bg-[url(https://i.pinimg.com/originals/79/5c/cb/795ccbc6b43baffe39982b297c882f70.gif)]" : 
            "bg-[url(https://i.pinimg.com/originals/ca/3b/ba/ca3bbaf943e160b1296708f3fc01457b.gif)]"
        } 
         bg-opacity-20`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* <svg className="w-24 h-24 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg> */}
          {/* <img src="https://media.discordapp.net/attachments/1281340189729620090/1380702390822637610/heart_hands_echo_blue.png?ex=684ac58e&is=6849740e&hm=95793b227c5aaccc59f94285c998b5ffac72899012945624051fe97b599e4a94&=&format=webp&quality=lossless&width=1852&height=1310" alt="" /> */}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-6 right-6 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 right-8 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col justify-center items-center p-8">
        {isViewMatch ? (
          <div className="text-center animate-pulse">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-valentine-pink to-valentine-red rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-valentine-pink to-valentine-red bg-clip-text text-transparent mb-2">
              Matching in Session!
            </h2>
            <p className="text-valentine-red text-lg font-medium">
              You can now <a href="/match" className='text-valentine-darkPink underline'>view</a> your match!
            </p>
          </div>
        ) : (
          <div className="text-center">

            
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 font-plus-jakarta-sans">
              Finding your <span className='text-valentine-pink'>perfect match</span>
            </h2>
            
            <p className="text-gray-600 text-base sm:text-lg font-medium italic font-plus-jakarta-sans mb-4">
              aligning the (data) stars...
            </p>
            
            <div className="flex justify-center space-x-1 mb-6">
              <div className="w-2 h-2 bg-valentine-lightPink rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-valentine-pink rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-valentine-red rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>

            {/* Pickup Line Generator */}
            <div className="bg-white bg-opacity-80 rounded-lg p-4 shadow-md max-w-md mx-auto">
              <div className='text-gray-700 text-sm font-bold mb-3 font-plus-jakarta-sans'>nervous about how to break the ice? get some pickup lines below...</div>
              <p className="text-gray-700 py-4 text-sm italic mb-3 font-plus-jakarta-sans">
                "{pickupLines[currentPickupLine]}"
              </p>
              <button
                onClick={getRandomPickupLine}
                className="bg-gradient-to-r from-valentine-pink to-valentine-red hover:from-valentine-red hover:to-valentine-darkPink text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
              >
              another one pls :3
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchComponent;