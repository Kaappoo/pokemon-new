export default function Footer() {
    return (
        <footer className="flex flex-col items-center justify-center gap-4 py-8 px-4 bg-(--bg-footer) border-t border-white/[0.06]">
            <div className="flex flex-col items-center gap-2">
                <p className="m-0 text-center text-sm text-(--text-secondary) opacity-60">
                    This website is not affiliated with Nintendo or Pokémon Company.
                </p>
                <p className="m-0 text-center text-sm text-(--text-secondary) opacity-60">
                    All data made available by the{' '}
                    <a
                        href="https://tcgdex.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--accent-purple) hover:underline font-medium transition-colors hover:brightness-125"
                    >
                        tcgdex api
                    </a>
                    .
                </p>
            </div>

            <div className="w-16 h-px bg-white/10" />

            <p className="m-0 text-center text-sm text-(--text-secondary) font-medium">
                Developed by Kauã Andrade Pacheco
            </p>

            <div className="flex gap-6">
                <a
                    href="https://github.com/Kaappoo/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--accent-purple) hover:underline font-semibold text-sm transition-all hover:brightness-125 hover:scale-105"
                >
                    Github
                </a>
                <a
                    href="https://www.linkedin.com/in/kau%C3%A3-andrade-pacheco-360675226/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--accent-purple) hover:underline font-semibold text-sm transition-all hover:brightness-125 hover:scale-105"
                >
                    Linkedin
                </a>
            </div>
        </footer>
    )
}
