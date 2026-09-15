import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCard } from '@/hooks/usePokemonApi'
import { useWishlist } from '@/hooks/useWishlist'
import { useState } from 'react'
import { Heart, Plus, Check } from 'lucide-react'
import { collectionApi } from '@/lib/api'
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton'

export const Route = createFileRoute('/cards/$cardId')({
    component: ViewCardPage,
})

function ViewCardPage() {
    const { cardId } = Route.useParams()
    const navigate = useNavigate()
    const { card, isLoading } = useCard(cardId)
    const { isInWishlist, toggleWishlist, isLoggedIn } = useWishlist()

    const [isAddingCollection, setIsAddingCollection] = useState(false)
    const [collectionAdded, setCollectionAdded] = useState(false)

    if (isLoading) {
        return (
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-10 min-h-screen bg-(--bg-primary)">
                <div className="skeleton w-[250px] md:w-[300px] h-[350px] md:h-[420px] rounded-xl" />
                <div className="flex-1 flex flex-col gap-4">
                    <div className="skeleton w-48 h-8 rounded-lg" />
                    <div className="skeleton w-32 h-6 rounded-lg" />
                    <div className="skeleton w-full h-24 rounded-lg" />
                </div>
            </div>
        )
    }

    if (!card) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-(--bg-primary) text-(--text-primary)">
                <h2 className="text-xl font-semibold opacity-60">Card not found</h2>
            </div>
        )
    }

    const wishlisted = isInWishlist(card.id)

    const handleWishlistToggle = async () => {
        if (!isLoggedIn) {
            navigate({ to: '/login' })
            return
        }
        try {
            await toggleWishlist({
                card_id: card.id,
                card_name: card.name,
                card_image: card.image,
                set_id: card.set?.id || '',
                set_name: card.set?.name || '',
            })
        } catch (err: any) {
            alert(err.message || 'Failed to update wishlist')
        }
    }

    const handleAddToCollection = async () => {
        if (!isLoggedIn) {
            navigate({ to: '/login' })
            return
        }
        setIsAddingCollection(true)
        try {
            await collectionApi.addToCollection({
                card_id: card.id,
                card_name: card.name,
                card_image: card.image,
                set_id: card.set?.id || '',
                set_name: card.set?.name || '',
                rarity: card.rarity || '',
                quantity: 1,
            })
            setCollectionAdded(true)
            setTimeout(() => setCollectionAdded(false), 2500)
        } catch (err: any) {
            alert(err.message || 'Failed to add card to collection')
        } finally {
            setIsAddingCollection(false)
        }
    }

    return (
        <div className="flex flex-col p-6 md:p-10 min-h-screen bg-(--bg-primary) text-(--text-primary)">
            <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col gap-4 shrink-0 items-center md:items-start">
                    <div className="relative group">
                        <ImageWithSkeleton
                            src={`${card.image}/high.webp`}
                            alt={card.name}
                            aspectRatio="5/7"
                            containerClassName="w-[200px] md:w-[20vw] max-w-[350px] rounded-xl self-center md:self-start shadow-[0_8px_40px_rgba(136,59,207,0.25),0_4px_12px_rgba(0,0,0,0.4)]"
                            className="w-full h-full rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                    </div>

                    {/* Action buttons under card image */}
                    <div className="flex flex-col w-full max-w-[350px] gap-2.5">
                        <button
                            onClick={handleWishlistToggle}
                            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                                wishlisted
                                    ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10'
                                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-red-400/50'
                            }`}
                        >
                            <Heart size={16} className={wishlisted ? 'fill-current text-red-400' : ''} />
                            {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                        </button>

                        <button
                            onClick={handleAddToCollection}
                            disabled={isAddingCollection}
                            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                                collectionAdded
                                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                    : 'bg-[#883bcf]/20 hover:bg-[#883bcf]/30 text-white border-[#883bcf]/40'
                            }`}
                        >
                            {collectionAdded ? (
                                <>
                                    <Check size={16} /> Added to Collection
                                </>
                            ) : (
                                <>
                                    <Plus size={16} /> Add 1 to Collection
                                </>
                            )}
                        </button>
                    </div>

                    {card.description && (
                        <div className="p-4 text-sm italic text-(--text-secondary) border-b border-white/10 max-w-[350px] leading-relaxed">
                            {card.description}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 flex-1">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-12 pb-6 border-b border-white/10">
                        <div className="flex gap-8 md:gap-12">
                            <InfoBlock label="name">
                                <h2 className="m-0 text-xl md:text-2xl font-bold bg-linear-to-r from-white to-[#d9d0ff] bg-clip-text text-transparent">{card.name}</h2>
                            </InfoBlock>
                            {card.types && card.types.length > 0 && (
                                <InfoBlock label="type">
                                    <h2 className="m-0 text-xl md:text-2xl font-bold">{card.types.join(' & ')}</h2>
                                </InfoBlock>
                            )}
                            {card.stage && (
                                <InfoBlock label="stage">
                                    <h2 className="m-0 text-xl md:text-2xl font-bold">{card.stage}</h2>
                                </InfoBlock>
                            )}
                        </div>
                        <div className="flex gap-8 md:gap-12">
                            {card.hp != null && (
                                <InfoBlock label="HP">
                                    <h2 className="m-0 text-xl md:text-2xl font-bold text-red-400">{card.hp}</h2>
                                </InfoBlock>
                            )}
                            <InfoBlock label="set">
                                <h2 className="m-0 text-xl md:text-2xl font-bold">{card.set?.name}</h2>
                            </InfoBlock>
                            {card.evolveFrom && (
                                <InfoBlock label="evolves from">
                                    <h2 className="m-0 text-xl md:text-2xl font-bold">{card.evolveFrom}</h2>
                                </InfoBlock>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pb-6 border-b border-white/10">
                        <InfoBlock label="category"><span className="font-medium">{card.category}</span></InfoBlock>
                        {card.rarity && <InfoBlock label="rarity"><span className="font-medium">{card.rarity}</span></InfoBlock>}
                        {card.illustrator && <InfoBlock label="illustrator"><span className="font-medium">{card.illustrator}</span></InfoBlock>}
                        {card.regulationMark && <InfoBlock label="regulation mark"><span className="font-medium">{card.regulationMark}</span></InfoBlock>}
                    </div>

                    {((card.abilities && card.abilities.length > 0) || (card.attacks && card.attacks.length > 0)) && (
                        <div className="flex flex-col gap-4">
                            <h2 className="m-0 text-lg md:text-xl font-extrabold uppercase tracking-wide bg-linear-to-r from-[#d9d0ff] to-white bg-clip-text text-transparent">
                                Abilities and Attacks
                            </h2>
                            {card.abilities?.map((ability, i) => (
                                <div key={i} className="p-4 rounded-xl flex flex-col gap-2 bg-white/[0.03] border border-white/[0.08] transition-colors hover:border-white/15">
                                    <h3 className="m-0 text-base font-normal">
                                        <b className="text-(--accent-purple)">{ability.type}</b> {ability.name}
                                    </h3>
                                    <span className="text-sm text-(--text-secondary) leading-relaxed">{ability.text}</span>
                                </div>
                            ))}
                            {card.attacks?.map((attack, i) => (
                                <div key={i} className="p-4 rounded-xl flex flex-col gap-2 bg-white/[0.03] border border-white/[0.08] transition-colors hover:border-white/15">
                                    <div className="flex items-center gap-1 font-medium">
                                        {attack.cost?.map((cost, j) => (<span key={j} className={`energy-icon ${cost}`} />))}
                                        <span className="ml-2">{attack.name}</span>
                                        {attack.damage != null && <span className="text-xl font-bold ml-4 text-(--accent-purple)">{attack.damage}</span>}
                                    </div>
                                    {attack.effect && <span className="text-sm text-(--text-secondary) leading-relaxed">{attack.effect}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-8 pb-6 border-b border-white/10">
                        <InfoBlock label="weaknesses">
                            <div className="flex items-center gap-2">
                                {card.weaknesses?.length ? card.weaknesses.map((w, i) => (
                                    <span key={i} className="flex items-center gap-1"><span className={`energy-icon ${w.type}`} />{w.value}</span>
                                )) : <span className="opacity-40 text-sm">none</span>}
                            </div>
                        </InfoBlock>
                        <InfoBlock label="resistances">
                            <div className="flex items-center gap-2">
                                {card.resistances?.length ? card.resistances.map((r, i) => (
                                    <span key={i} className="flex items-center gap-1"><span className={`energy-icon ${r.type}`} />{r.value}</span>
                                )) : <span className="opacity-40 text-sm">none</span>}
                            </div>
                        </InfoBlock>
                        <InfoBlock label="retreat cost">
                            <div className="flex items-center gap-1">
                                {card.retreat != null && card.retreat > 0
                                    ? Array.from({ length: card.retreat }).map((_, i) => (<span key={i} className="energy-icon Colorless" />))
                                    : <span className="opacity-40 text-sm">none</span>}
                            </div>
                        </InfoBlock>
                    </div>

                    {card.variants && (
                        <div className="flex flex-wrap gap-3 pb-6 border-b border-white/10">
                            <InfoBlock label="variants">
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(card.variants).filter(([, v]) => v).map(([variant]) => (
                                        <span key={variant} className="px-3 py-1 rounded-full text-xs font-semibold bg-(--accent-purple)/20 text-(--text-secondary) border border-(--accent-purple)/30">
                                            {variant}
                                        </span>
                                    ))}
                                </div>
                            </InfoBlock>
                        </div>
                    )}

                    {card.legal && (
                        <div className="flex gap-4">
                            <InfoBlock label="legality">
                                <div className="flex gap-3">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${card.legal.standard ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                                        Standard: {card.legal.standard ? '✓' : '✗'}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${card.legal.expanded ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
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
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary) opacity-60">{label}</span>
            {children}
        </div>
    )
}
