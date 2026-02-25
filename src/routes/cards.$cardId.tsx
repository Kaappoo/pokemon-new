import { createFileRoute } from '@tanstack/react-router'
import { useCard, type CardDetail } from '@/hooks/usePokemonApi'

export const Route = createFileRoute('/cards/$cardId')({
    component: ViewCardPage,
})

function ViewCardPage() {
    const { cardId } = Route.useParams()
    const { card, isLoading } = useCard(cardId)

    if (isLoading) {
        return (
            <div className="flex flex-col md:flex-row gap-8 p-4 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="skeleton w-[250px] md:w-[300px] h-[350px] md:h-[420px] rounded-xl" />
                <div className="flex-1 flex flex-col gap-4">
                    <div className="skeleton w-48 h-8 rounded" />
                    <div className="skeleton w-32 h-6 rounded" />
                    <div className="skeleton w-full h-24 rounded" />
                </div>
            </div>
        )
    }

    if (!card) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <h2>Card not found</h2>
            </div>
        )
    }

    return (
        <div className="flex flex-col p-4 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Image + Description */}
                <div className="flex flex-col gap-4">
                    <img src={`${card.image}/high.webp`} alt={card.name} className="w-[200px] md:w-[20vw] max-w-[350px] rounded-xl self-center md:self-start" />
                    {card.description && (
                        <div className="p-3 text-sm italic" style={{ borderBottom: '1px solid var(--text-secondary)', maxWidth: '350px' }}>
                            {card.description}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-6 flex-1">
                    {/* Basic info */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-12 pb-4" style={{ borderBottom: '1px solid var(--text-secondary)' }}>
                        <div className="flex gap-8 md:gap-12">
                            <InfoBlock label="name"><h2 className="m-0 text-xl md:text-2xl">{card.name}</h2></InfoBlock>
                            {card.types && card.types.length > 0 && <InfoBlock label="type"><h2 className="m-0 text-xl md:text-2xl">{card.types.join(' & ')}</h2></InfoBlock>}
                            {card.stage && <InfoBlock label="stage"><h2 className="m-0 text-xl md:text-2xl">{card.stage}</h2></InfoBlock>}
                        </div>
                        <div className="flex gap-8 md:gap-12">
                            {card.hp != null && <InfoBlock label="HP"><h2 className="m-0 text-xl md:text-2xl">{card.hp}</h2></InfoBlock>}
                            <InfoBlock label="set"><h2 className="m-0 text-xl md:text-2xl">{card.set?.name}</h2></InfoBlock>
                            {card.evolveFrom && <InfoBlock label="evolves from"><h2 className="m-0 text-xl md:text-2xl">{card.evolveFrom}</h2></InfoBlock>}
                        </div>
                    </div>

                    {/* Category & meta */}
                    <div className="flex gap-6 pb-4" style={{ borderBottom: '1px solid var(--text-secondary)' }}>
                        <InfoBlock label="category"><span>{card.category}</span></InfoBlock>
                        {card.rarity && <InfoBlock label="rarity"><span>{card.rarity}</span></InfoBlock>}
                        {card.illustrator && <InfoBlock label="illustrator"><span>{card.illustrator}</span></InfoBlock>}
                        {card.regulationMark && <InfoBlock label="regulation mark"><span>{card.regulationMark}</span></InfoBlock>}
                    </div>

                    {/* Abilities & Attacks */}
                    {((card.abilities && card.abilities.length > 0) || (card.attacks && card.attacks.length > 0)) && (
                        <div className="flex flex-col gap-4">
                            <h2 className="m-0 text-lg md:text-xl font-bold">ABILITIES AND ATTACKS</h2>
                            {card.abilities?.map((ability, i) => (
                                <div key={i} className="p-4 rounded flex flex-col gap-1" style={{ border: '1px solid var(--text-secondary)' }}>
                                    <h2 className="m-0 text-lg font-normal"><b>{ability.type}</b> {ability.name}</h2>
                                    <span className="text-sm">{ability.text}</span>
                                </div>
                            ))}
                            {card.attacks?.map((attack, i) => (
                                <div key={i} className="p-4 rounded flex flex-col gap-1" style={{ border: '1px solid var(--text-secondary)' }}>
                                    <div className="flex items-center gap-1 font-medium">
                                        {attack.cost?.map((cost, j) => (<span key={j} className={`energy-icon ${cost}`} />))}
                                        <span className="ml-2">{attack.name}</span>
                                        {attack.damage != null && <span className="text-xl font-bold ml-4">{attack.damage}</span>}
                                    </div>
                                    {attack.effect && <span className="text-sm">{attack.effect}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Weaknesses / Resistances / Retreat */}
                    <div className="flex flex-wrap gap-6 pb-4" style={{ borderBottom: '1px solid var(--text-secondary)' }}>
                        <InfoBlock label="weaknesses">
                            <div className="flex items-center gap-2">
                                {card.weaknesses?.length ? card.weaknesses.map((w, i) => (
                                    <span key={i} className="flex items-center gap-1"><span className={`energy-icon ${w.type}`} />{w.value}</span>
                                )) : <span className="opacity-50">none</span>}
                            </div>
                        </InfoBlock>
                        <InfoBlock label="resistances">
                            <div className="flex items-center gap-2">
                                {card.resistances?.length ? card.resistances.map((r, i) => (
                                    <span key={i} className="flex items-center gap-1"><span className={`energy-icon ${r.type}`} />{r.value}</span>
                                )) : <span className="opacity-50">none</span>}
                            </div>
                        </InfoBlock>
                        <InfoBlock label="retreat cost">
                            <div className="flex items-center gap-1">
                                {card.retreat != null && card.retreat > 0
                                    ? Array.from({ length: card.retreat }).map((_, i) => (<span key={i} className="energy-icon Colorless" />))
                                    : <span className="opacity-50">none</span>}
                            </div>
                        </InfoBlock>
                    </div>

                    {/* Variants */}
                    {card.variants && (
                        <div className="flex flex-wrap gap-3 pb-4" style={{ borderBottom: '1px solid var(--text-secondary)' }}>
                            <InfoBlock label="variants">
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(card.variants).filter(([, v]) => v).map(([variant]) => (
                                        <span key={variant} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'var(--bg-header)' }}>{variant}</span>
                                    ))}
                                </div>
                            </InfoBlock>
                        </div>
                    )}

                    {/* Legality */}
                    {card.legal && (
                        <div className="flex gap-4">
                            <InfoBlock label="legality">
                                <div className="flex gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${card.legal.standard ? 'bg-green-800' : 'bg-red-900'}`}>
                                        Standard: {card.legal.standard ? '✓' : '✗'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${card.legal.expanded ? 'bg-green-800' : 'bg-red-900'}`}>
                                        Expanded: {card.legal.expanded ? '✓' : '✗'}
                                    </span>
                                </div>
                            </InfoBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            {children}
        </div>
    )
}
