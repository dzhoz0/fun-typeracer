import { Box } from "@radix-ui/themes";
import { useEffect, useRef } from "react";

type TypingBoxProps = {
    targetText: string;
    currentText: string;
};

export default function TypingBox({ targetText, currentText }: TypingBoxProps) {
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const caretRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const caret = caretRef.current;
        const container = containerRef.current;
        const charEl = charRefs.current[currentText.length];

        if (!caret || !container || !charEl) return;

        const charRect = charEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const x = charRect.left - containerRect.left;
        const y = charRect.top - containerRect.top - 2;

        caret.style.transform = `translate(${x}px, ${y}px)`;
        caret.style.height = `${charRect.height}px`;
    }, [currentText]);

    return (
        <Box className="w-full mx-auto py-5">
            <div className="mb-2 text-sm font-medium text-gray-700">
                Text to Type
            </div>

            <Box
                ref={containerRef}
                className="
                  relative
                  rounded-lg
                  bg-gray-100
                  border
                  border-gray-300
                  p-4
                  font-mono
                  text-sm
                  leading-relaxed
                  whitespace-pre-wrap
                  wrap-break-word
                "
            >
                {/* Caret */}
                <div
                    ref={caretRef}
                    className="typing-caret"
                />

                {Array.from({
                    length: Math.max(targetText.length, currentText.length) + 1,
                }).map((_, index) => {
                    let className = "text-gray-500";
                    const typedChar = currentText[index];
                    const targetChar = targetText[index];

                    if (index === targetText.length) {
                        return (
                            <span
                                key="end"
                                ref={(el) => { charRefs.current[index] = el; }}
                                className="inline-block w-[0.5ch]"
                            />
                        );
                    }

                    if (typedChar !== undefined) {
                        className =
                            typedChar === targetChar
                                ? "text-green-600"
                                : "text-red-500";
                    }

                    return (
                        <span
                            key={index}
                            ref={(el) => { charRefs.current[index] = el; }}
                            className={`relative ${className}`}
                        >
                            {targetChar === " " ? (
                                <span
                                      className={
                                          typedChar !== undefined && typedChar !== " "
                                              ? "space-error"
                                              : "space"
                                      }
                                />
                            ) : (
                                  targetChar
                            )}
                        </span>
                    );
                })}
            </Box>
        </Box>
    );
}
