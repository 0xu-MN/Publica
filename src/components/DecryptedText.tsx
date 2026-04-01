import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface DecryptedTextProps {
    words: string[];
    interval?: number;
    style?: StyleProp<TextStyle>;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
    words,
    interval = 3000,
    style
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayText, setDisplayText] = useState(words[0]);
    const [isDecrypting, setIsDecrypting] = useState(false);

    useEffect(() => {
        let rotationTimer: NodeJS.Timeout;

        const startRotation = () => {
            rotationTimer = setInterval(() => {
                if (isDecrypting) return;

                setIsDecrypting(true);
                setCurrentIndex((prev) => (prev + 1) % words.length);
            }, interval);
        };

        startRotation();
        return () => clearInterval(rotationTimer);
    }, [words, interval, isDecrypting]);

    useEffect(() => {
        if (!isDecrypting) return;

        const targetWord = words[currentIndex];
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
            }
        }, 80);

        return () => clearInterval(decryptInterval);
    }, [isDecrypting, currentIndex, words]);

    return <Text style={style}>{displayText}</Text>;
};
