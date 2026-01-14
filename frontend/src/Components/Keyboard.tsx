type OnScreenKeyboardProps = {
    layout: string[][];
    activeKeys?: ReadonlySet<string>;
};


export function OnScreenKeyboard({ layout, activeKeys = new Set() }: OnScreenKeyboardProps) {
    const classNames = (...parts: Array<string | false | null | undefined>) =>
        parts.filter(Boolean).join(' ');

    return (
        <div className="flex flex-col gap-2 select-none">
            {layout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1.5">
                    {row.map((key, colIndex) => {
                        const isActive = activeKeys.has(key);
                        const label = key === ' ' ? 'SPACE' : key.toUpperCase();
                        const keyId = `${rowIndex}-${colIndex}-${key}`;

                        const base = [
                            'flex',
                            'items-center',
                            'justify-center',
                            'rounded-md',
                            'font-mono',
                            'text-sm',
                            'transition-all',
                            'duration-100',
                            'h-10',
                            key === ' ' ? 'w-40' : 'w-10',
                        ];

                        const state = isActive
                            ? ['bg-emerald-400', 'text-black', 'scale-95']
                            : ['bg-zinc-800', 'text-zinc-300'];

                        return (
                            <div key={keyId} className={classNames(...base, ...state)}>
                                {label}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
