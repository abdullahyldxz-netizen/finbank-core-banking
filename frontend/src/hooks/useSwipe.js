import { useState, useEffect } from 'react';

export function useSwipe({ onSwipedLeft, onSwipedRight, threshold = 50 }) {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swiping, setSwiping] = useState(false);
    const [offset, setOffset] = useState(0);

    // reset per swipe
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setSwiping(true);
        setOffset(0);
    };

    const handleTouchMove = (e) => {
        const currentX = e.targetTouches[0].clientX;
        setTouchEnd(currentX);
        if (touchStart) {
            let nextOffset = currentX - touchStart;
            // Limit swipe visual offset
            if (nextOffset > window.innerWidth * 0.4) nextOffset = window.innerWidth * 0.4;
            if (nextOffset < -window.innerWidth * 0.4) nextOffset = -window.innerWidth * 0.4;
            setOffset(nextOffset);
        }
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            setSwiping(false);
            setOffset(0);
            return;
        }

        const distance = touchEnd - touchStart;
        const isLeftSwipe = distance < -threshold;
        const isRightSwipe = distance > threshold;

        if (isLeftSwipe && onSwipedLeft) {
            onSwipedLeft();
        } else if (isRightSwipe && onSwipedRight) {
            onSwipedRight();
        }

        setSwiping(false);
        setOffset(0);
    };

    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        swiping,
        offset
    };
}
