export default function Footer() {
    return (
        <footer
            style={{ backgroundColor: 'var(--bg-footer)' }}
            className="flex flex-col items-center justify-center text-white gap-3 py-6 px-4"
        >
            <h4 className="m-0 text-center text-sm font-normal">
                This website is not affiliated with Nintendo or Pokemon Company.
            </h4>
            <h4 className="m-0 text-center text-sm font-normal">
                All data made available by the{' '}
                <a
                    href="https://pokemontcg.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-purple)' }}
                    className="hover:underline"
                >
                    pokemontcg api
                </a>
                .
            </h4>
            <h4 className="m-0 text-center text-sm font-normal">
                Developed by Kauã Andrade Pacheco
            </h4>
            <div className="flex gap-4">
                <a
                    href="https://github.com/Kaappoo/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-purple)' }}
                    className="hover:underline font-medium"
                >
                    Github
                </a>
                <a
                    href="https://www.linkedin.com/in/kau%C3%A3-andrade-pacheco-360675226/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-purple)' }}
                    className="hover:underline font-medium"
                >
                    Linkedin
                </a>
            </div>
        </footer>
    )
}
