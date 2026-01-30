import React, { useState } from "react";
import Image from "next/image";

const options = [
  "10% OFF",
  "100% OFF",
  "5% OFF",
  "Gift worth $100",
  "Free Shipping",
  "Good Luck Again",
];

const SpinWheel = () => {
  const [spinDegree, setSpinDegree] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return; // Prevent spinning while it's already spinning

    setIsSpinning(true);
    const randomSpin = Math.floor(Math.random() * 360) + 3600; // Random spin between 3600 and 7200 degrees
    setSpinDegree(randomSpin);

    // Reset the spinning state after the wheel completes the animation (4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="relative flex justify-center items-center">
      <div
        className="w-96 h-96 rounded-full border-4 border-gray-300 flex justify-center items-center"
        style={{
          transform: `rotate(${spinDegree}deg)`,
          transition: "transform 4s ease-out",
        }}
      >
        <div className="absolute w-72 h-72 rounded-full bg-pink-100 flex justify-center items-center">
          <div className="flex items-center justify-center">
            {options.map((option, index) => (
              <div
                key={index}
                className="w-1/2 h-1/2 absolute text-center flex items-center justify-center transform -rotate-45"
                style={{
                  transform: `rotate(${(360 / options.length) * index}deg)`,
                  top: "50%",
                }}
              >
                <span className="block transform rotate-45">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={spinWheel}
        className="absolute bottom-10 text-white bg-blue-500 p-4 rounded-full"
      >
        Spin
      </button>
    </div>
  );
};

export default SpinWheel;
