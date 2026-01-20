import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

interface DecryptedTextProps {
    words: string[];
    interval?: number;
    className?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
    words,
    interval = 3000,
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayText, setDisplayText] = useState(words[0]);
    const [isDecrypting, setIsDecrypting] = useState(false);

    useEffect(() => {
        const rotationTimer = setInterval(() => {
            setIsDecrypting(true);
            const nextIndex = (currentIndex + 1) % words.length;
            const targetWord = words[nextIndex];

            // Decryption animation
            let iterations = 0;
            const decryptInterval = setInterval(() => {
                setDisplayText(
                    targetWord
                        .split('')
                        .map((char, index) => {
                            if (index < iterations) {
                                return targetWord[index];
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join('')
                );

                iterations += 1;

                if (iterations > targetWord.length) {
                    clearInterval(decryptInterval);
                    setDisplayText(targetWord);
                    setIsDecrypting(false);
                    setCurrentIndex(nextIndex);
                }
            }, 80); // Speed up for snappy effect

            return () => clearInterval(decryptInterval);
        }, interval);

        return () => clearInterval(rotationTimer);
    }, [currentIndex, words, interval]);

    return <Text className={className}>{displayText}</Text>;
};
