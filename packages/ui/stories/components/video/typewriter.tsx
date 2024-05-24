import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, speed = 40, progress }: any) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (progress < 100) {
      const textLength = Math.floor((progress / 100) * text.length);
      const interval = Math.max(speed, (100 - progress) * speed / 100);
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < textLength) {
            setDisplayedText(text.substring(0, prevIndex + 1));
            return prevIndex + 1;
          } else {
            clearInterval(timer);
            return prevIndex;
          }
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [progress, text, speed]);

  return <div>{displayedText}</div>;
};

export default Typewriter;
