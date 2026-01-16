import { Box } from "@radix-ui/themes";

type TypingBoxProps = {
    targetText: string;
    currentText: string;
};

export default function TypingBox({ targetText, currentText }: TypingBoxProps) {
    return (
        <Box className="w-full mx-auto py-5">
            {/* Label */}
            <div className="mb-2 text-sm font-medium text-gray-700">
                Text to Type
            </div>

            {/* Typing container */}
            <Box
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
                {Array.from({
                    length: Math.max(targetText.length, currentText.length),
                }).map((_, index) => {
                    let className = "text-gray-500";
                    const typedChar = currentText[index];
                    const targetChar = targetText[index];

                    if (typedChar !== undefined) {
                        if (targetChar === undefined || typedChar !== targetChar) {
                            className = "text-red-500";
                        } else {
                            className = "text-green-600";
                        }
                    }

                    return (
                        <span key={index} className="relative">
                            {index === currentText.length && (
                                <span>
                                    |
                                </span>
                            )}

                            <span className={className}>
                                {typedChar ?? targetChar}
                            </span>
                        </span>
                    );
                })}
            </Box>
        </Box>
    );
}
