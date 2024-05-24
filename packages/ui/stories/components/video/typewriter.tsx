import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, speed = 50, progress }: any) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const textLength = Math.floor((progress / 100) * text.length);
    setDisplayedText(text.substring(0, textLength));
  }, [progress, text]);

  return <div>{displayedText}</div>;
};

export default Typewriter;
